import { createLogger } from "@/lib/PbLoggerLib"
import { env } from "@/lib/PbEnvLib"
import { createCargoOffer, deleteCargoOffer, getCargo } from "@/server/repositories/PbCargoOfferRepository"
import cacheService from "@/server/services/PbCacheService"
import { saveFretefyStatusCarga } from "@/server/repositories/PbFretefyStatusCargaRepository"
import { findManifestsSince } from "@/server/repositories/PbManifestRepository"
import { FretefyCargoSituacao, type FretefyCargoDetail, type FretefyDestino, type FretefyOfertaCargaInput } from "@/types/PbFretefyType"
import { getFretefyTypes } from "@/server/services/PbFretefyTypesService"
import { getFretefyTracks } from "@/server/repositories/PbFretefyCargoRepository"

const log = createLogger("PbCargoOfferService")

function parseCronIntervalMinutes(cron: string, fallback = 30): number {
  const fields = cron.trim().split(/\s+/)
  const minutesField = fields.length === 6 ? fields[1] : fields[0]
  const match = minutesField?.match(/^\*\/(\d+)$/)
  return match?.[1] ? parseInt(match[1], 10) : fallback
}

export async function syncFretefyTracks(): Promise<void> {
  const {tiposVeiculo, tiposCarroceria, tiposCarga, tiposTarifa} = await getFretefyTypes()

  const [tipoVeiculo] = tiposVeiculo
  const [tipoCarroceria] = tiposCarroceria
  const [tipoCarga] = tiposCarga
  const [tipoTarifa] = tiposTarifa

  if (!tipoVeiculo || !tipoCarroceria || !tipoCarga || !tipoTarifa) {
    log.error({ tipoVeiculo, tipoCarroceria, tipoCarga, tipoTarifa }, "Tipos dinâmicos ausentes")
    throw new Error("Tipos da API Fretefy não encontrados")
  }

  const today = new Date()
  const todayStr = [
    String(today.getFullYear()).slice(2),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("/")
  const manifests = await findManifestsSince(todayStr)

  if (manifests.length === 0) {
    log.info("Nenhuma entrega nova para sincronizar. Todos os dados já estão sincronizados.")
    return
  }

  const byPlate = Map.groupBy(manifests, (m) => m.plate ?? "SEM_PLACA")

  log.info(
    { totalManifests: manifests.length, totalRoutes: byPlate.size },
    "Iniciando sincronização de rotas com o Fretefy",
  )

  const intervalMinutes = parseCronIntervalMinutes(env.SYNC_TRACKS_CRON)
  const startAt = new Date(Date.now() - (intervalMinutes + 5) * 60 * 1000)

  let recentFretefyCargas: FretefyCargoDetail[] = []
  try {
    recentFretefyCargas = await getFretefyTracks({ startAt })
    log.info({ total: recentFretefyCargas.length, startAt }, "Cargas recentes do Fretefy consultadas")
  } catch (e) {
    log.warn({ err: e }, "Falha ao consultar cargas recentes do Fretefy — prosseguindo sem verificação prévia")
  }

  const origem = {
    localidade: env.PLENOBRAS_ENDERECO,
    cidade: env.PLENOBRAS_CIDADE,
    uf: env.PLENOBRAS_UF,
    motivo: 1,
    empresa: {
      documento: env.PLENOBRAS_DOCUMENTO,
      razaoSocial: env.PLENOBRAS_RAZAO_SOCIAL,
      endereco: env.PLENOBRAS_ENDERECO,
      cidade: env.PLENOBRAS_CIDADE,
      uf: env.PLENOBRAS_UF,
    },
  }

  for (const [plate, rows] of byPlate) {
    const firstRow = rows[0]!
    const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19)
    const pedidoRef = `MDFe-${firstRow.number}-${plate}`

    const byAddress = Map.groupBy(rows, (row) => {
      const street = [row.deliveryStreet, row.deliveryNumber].filter(Boolean).join(", ")
      return `${street}|${row.deliveryCity ?? ""}|${row.deliveryState ?? ""}`
    })

    const paradas: FretefyDestino[] = Array.from(byAddress.values()).map((addressRows) => {
      const firstRow = addressRows[0]!
      const enderecoEntrega = [firstRow.deliveryStreet, firstRow.deliveryNumber].filter(Boolean).join(", ")
      return {
        localidade: enderecoEntrega,
        cidade: firstRow.deliveryCity ?? "",
        uf: firstRow.deliveryState ?? "",
        motivo: 2,
        empresa: {
          documento: firstRow.customerTaxId ?? "",
          razaoSocial: firstRow.customerName ?? "",
          endereco: enderecoEntrega,
          cidade: firstRow.deliveryCity ?? "",
          uf: firstRow.deliveryState ?? "",
        },
        documentos: addressRows.map((row) => ({
          Chave: row.accessKey ?? "",
          Serie: row.series ?? "",
          Numero: row.invoiceNumber,
          Emitente: {
            documento: row.issuerTaxId ?? "",
            razaoSocial: env.PLENOBRAS_RAZAO_SOCIAL,
            endereco: env.PLENOBRAS_ENDERECO,
            cidade: env.PLENOBRAS_CIDADE,
            uf: env.PLENOBRAS_UF,
          },
          Destinatario: {
            documento: row.customerTaxId ?? "",
            razaoSocial: row.customerName ?? "",
            endereco: enderecoEntrega,
            cidade: row.deliveryCity ?? "",
            uf: row.deliveryState ?? "",
          },
        })),
      }
    })

    const payload: FretefyOfertaCargaInput = {
      unidadeNegocioId: env.PLENOBRAS_UNIDADE_NEGOCIO_ID,
      origem: { ...origem, dhInicio: timestamp },
      destino: {
        localidade: origem.localidade,
        cidade: origem.cidade,
        uf: origem.uf,
        motivo: 2,
        empresa: origem.empresa,
        documentos: [],
      },
      paradas,
      carga: {
        unidadeMedida: 5,
        modalidade: 1,
        pesoBruto: 0,
        valorCarga: 0,
        tipoFrete: "CIF",
        tipoCargaId: tipoCarga.id,
        pedidoEmbarcador: `${pedidoRef}`,
      },
      veiculo: {
        apenasCavaloMecanico: false,
        tiposVeiculo: [tipoVeiculo.id],
        tiposCarrocerias: [tipoCarroceria.id],
      },
      pagamento: {
        tipoTarifaId: tipoTarifa.id,
        valorFrete: 0,
      },
      alocacao: {
        veiculo: { placa: plate },
        motorista: {
          nome: firstRow.driverName ?? "",
          documento: firstRow.driverTaxId ?? "",
        },
      },
      observacao: `MDFe ${firstRow.number} - ${plate} - ${rows.length} NF(s)`,
      visibilidade: 1,
    }

    log.info({ pedidoRef, plate, totalNFs: rows.length }, "Disparando oferta de carga para o Fretefy")

    log.info(
      {
        dryRun: true,
        tipoVeiculo,
        tipoCarroceria,
        tipoCarga,
        tipoTarifa,
        payload,
      },
      "DRY RUN — payload que seria enviado ao Fretefy",
    )

    const invoiceNumbers = new Set(rows.map((r) => r.invoiceNumber))
    const existingCargo = recentFretefyCargas.find((cargo) => {
      if (
        cargo.situacaoOfertaCarga === FretefyCargoSituacao.Finalizada ||
        cargo.situacaoOfertaCarga === FretefyCargoSituacao.Cancelada ||
        cargo.situacaoOfertaCarga === FretefyCargoSituacao.Desativada
      ) return false

      return cargo.paradas.some((parada) =>
        parada.documentos.some((doc) => {
          const nf = Number(doc.notaFiscal)
          return !isNaN(nf) && invoiceNumbers.has(nf)
        })
      )
    })

    let result: { id: string; situacao?: number }
    let cargoCreatedByUs = false

    if (existingCargo) {
      log.info({ cargaId: existingCargo.id, pedidoRef, plate }, "NF já encontrada em carga existente no Fretefy — pulando criação")
      result = existingCargo
    } else {
      try {
        result = await createCargoOffer(payload)
        cargoCreatedByUs = true
      } catch (e) {
        const is504 = e instanceof Error && e.message.includes("504")
        if (is504) {
          log.warn({ pedidoRef, plate }, "Oferta enviada ao Fretefy mas obteve timeout (504) — no próximo ciclo a carga será verificada novamente")
        } else {
          log.error({ pedidoRef, plate }, "Falha ao criar oferta no Fretefy — pulando para a próxima rota", e)
        }
        continue
      }
    }

    let success = false

    try {
      await saveFretefyStatusCarga(
          rows.map((row) => ({
            company: row.company,
            branch: row.branch,
            issuerTaxId: row.issuerTaxId,
            series: row.series,
            invoiceNumber: row.invoiceNumber,
            type: "T",
            trackingNumber: result.id,
          })),
      )

      success = true

    } catch (e) {
      log.error({ cargaId: result.id, pedidoRef }, "Falha ao salvar no BD — revertendo oferta no Fretefy", e)
    }

    if (success) {
      try {
        const cargoDetail = await getCargo(result.id)
        cacheService.setJson(`fretefy:cargo:${result.id}`, cargoDetail, 300).catch((e: Error) =>
          log.warn({ cargaId: result.id, err: e }, "Falha ao gravar detalhe da carga no cache")
        )
      } catch (e) {
        log.warn({ cargaId: result.id }, "Falha ao buscar detalhe da carga para cache — prosseguindo sem cache")
      }
    }

    if (!success && cargoCreatedByUs) {
      try {
        await deleteCargoOffer(result.id)
        log.warn({ cargaId: result.id }, "Oferta revertida no Fretefy com sucesso")
      } catch (e) {
        log.error(
            { cargaId: result.id },
            "CRÍTICO: oferta criada no Fretefy mas não registrada e não revertida — intervenção manual necessária",
            e
        )
      }
    }

    log.info({ cargaId: result.id, situacao: result.situacao, pedidoRef, plate }, "Oferta de carga criada com sucesso")
  }
}
