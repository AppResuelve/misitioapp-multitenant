// @ts-nocheck
'use client'
import { useState, useRef, useMemo, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { FileSpreadsheet, AlertTriangle, Download } from 'lucide-react'
import { Button } from './ui/Form'
import { Modal } from './ui/Modal'
import { Spinner } from './ui/Spinner'
import { LoadingOverlay } from './ui/LoadingOverlay'
import { useAlert } from './ui/AlertContext'
import api from '@/services/admin-api'
import {
  NAME_ALIASES,
  PRICE_ALIASES,
  SLUG_ALIASES,
  OPTIONAL_FIELDS,
  UPDATE_FIELDS,
  ATTR_COL_PATTERN,
  VAL_COL_PATTERN,
  detectColumn,
  parseUpdateProducts,
} from './lib/excel-utils'
import { formatPrice } from './lib/utils'

const PREVIEW_SIZE = 50

function formatFieldValue(field, value) {
  if (value == null || value === '') return '—'
  if (field === 'retailPrice' || field === 'wholesalePrice' || field === 'comparePrice') return formatPrice(value)
  if (field === 'discountPercentage') return `${value}%`
  if (field === 'description') return String(value).substring(0, 50) + (String(value).length > 50 ? '...' : '')
  if (field === 'images') return '✓'
  return String(value)
}

export default function BulkUpdateModal({ open, onClose, onUpdated }) {
  const Alert = useAlert()
  const fileInputRef = useRef(null)
  const [step, setStep] = useState('upload')
  const [fileName, setFileName] = useState('')
  const [rawData, setRawData] = useState(null)
  const [nameCol, setNameCol] = useState('')
  const [priceCol, setPriceCol] = useState('')
  const [slugCol, setSlugCol] = useState('')
  const [optionals, setOptionals] = useState({})
  const [attrPairs, setAttrPairs] = useState([])
  const [readError, setReadError] = useState('')
  const [selectedField, setSelectedField] = useState('')
  const [preview, setPreview] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewPage, setPreviewPage] = useState(1)
  const [result, setResult] = useState(null)

  const selectedFieldDef = useMemo(
    () => UPDATE_FIELDS.find(f => f.key === selectedField),
    [selectedField]
  )

  const { products: parsed, errors } = useMemo(() => {
    if (!rawData || !slugCol || !selectedField) return { products: [], errors: [] }
    return parseUpdateProducts(rawData, slugCol, nameCol, priceCol, optionals, attrPairs, selectedField)
  }, [rawData, slugCol, nameCol, priceCol, optionals, attrPairs, selectedField])

  const fieldCol = selectedField === 'retailPrice' ? priceCol : (optionals[selectedField] || '')

  const flatDiffs = useMemo(() => {
    if (!preview) return []
    return preview.diffs.flatMap(d => {
      if (d.skus?.length) {
        return d.skus.map(s => ({
          slug: d.slug,
          name: d.name,
          variant: (s.attrValues || []).map(a => `${a.attrName}: ${a.value}`).join(', '),
          oldValue: s.oldValue,
          newValue: s.newValue,
        }))
      }
      return [{ slug: d.slug, name: d.name, variant: null, oldValue: d.oldValue, newValue: d.newValue }]
    })
  }, [preview])

  const totalPages = Math.ceil(flatDiffs.length / PREVIEW_SIZE)
  const pagedDiffs = flatDiffs.slice((previewPage - 1) * PREVIEW_SIZE, previewPage * PREVIEW_SIZE)

  useEffect(() => {
    setPreviewPage(1)
  }, [selectedField, rawData, slugCol])

  const handleFile = (file) => {
    setReadError('')
    setRawData(null)
    setNameCol('')
    setPriceCol('')
    setSlugCol('')
    setOptionals({})
    setAttrPairs([])
    setSelectedField('')
    setPreview(null)
    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })

        if (rows.length === 0) {
          setReadError('El archivo está vacío o no tiene datos.')
          return
        }

        const headers = Object.keys(rows[0])
        const data = { headers, rows }

        setRawData(data)
        setNameCol(detectColumn(headers, NAME_ALIASES))
        setPriceCol(detectColumn(headers, PRICE_ALIASES))
        setSlugCol(detectColumn(headers, SLUG_ALIASES))

        const detected = {}
        for (const { key, aliases } of OPTIONAL_FIELDS) {
          const col = detectColumn(headers, aliases)
          if (col) detected[key] = col
        }
        setOptionals(detected)

        const pairs = []
        const lowerHeaders = headers.map(h => h.toLowerCase().trim())
        let n = 1
        while (n <= 10) {
          const attrIdx = lowerHeaders.findIndex(h => ATTR_COL_PATTERN.test(h) && ATTR_COL_PATTERN.exec(h)[2] === String(n))
          const valIdx = lowerHeaders.findIndex(h => VAL_COL_PATTERN.test(h) && VAL_COL_PATTERN.exec(h)[2] === String(n))
          if (attrIdx !== -1 && valIdx !== -1) {
            pairs.push({ attrCol: headers[attrIdx], valCol: headers[valIdx], num: n })
          } else { break }
          n++
        }
        setAttrPairs(pairs)

        setStep('field')
      } catch {
        setReadError('No se pudo leer el archivo. Verificá que sea .xlsx o .csv válido.')
      }
    }

    reader.readAsArrayBuffer(file)
  }

  const handlePreview = async () => {
    const payload = parsed.map(p => {
      const data = { slug: p.excelSlug || p.slug }
      if (p.skus?.length > 0) {
        data.skus = p.skus.map(s => ({ attrValues: s.attrValues, value: s.value }))
      } else {
        data.value = p.value
      }
      return data
    })

    setPreviewLoading(true)
    try {
      const { data } = await api.post('/admin/products/bulk-update/preview', {
        field: selectedField,
        products: payload,
      })
      setPreview(data)
      setStep('preview')
    } catch (err) {
      let msg = 'Error al comparar los productos'
      try {
        const body = typeof err.response?.data === 'string'
          ? JSON.parse(err.response.data)
          : err.response?.data
        msg = body?.error || body?.message || msg
      } catch {}
      Alert.fire({ message: msg, type: 'error' })
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!preview || preview.diffs.length === 0) return

    const payload = preview.diffs.map(d => {
      const data = { slug: d.slug, oldValue: d.oldValue, newValue: d.newValue }
      if (d.skus?.length > 0) {
        data.skus = d.skus.map(s => ({ attrValues: s.attrValues, oldValue: s.oldValue, newValue: s.newValue }))
      }
      return data
    })

    setStep('processing')

    try {
      const { data } = await api.post('/admin/products/bulk-update', {
        field: selectedField,
        products: payload,
      })

      setResult(data)

      Alert.fire({
        message: `${data.updated} producto(s) actualizado(s). ${data.skipped > 0 ? `${data.skipped} omitido(s).` : ''}`,
        type: 'success',
      })

      onUpdated?.()
      setStep('results')
    } catch (err) {
      let msg = 'Error al actualizar productos'
      try {
        const body = typeof err.response?.data === 'string'
          ? JSON.parse(err.response.data)
          : err.response?.data
        msg = body?.error || body?.message || msg
      } catch {}
      Alert.fire({ message: msg, type: 'error' })
      setStep('preview')
    }
  }

  const handleClose = () => {
    setStep('upload')
    setRawData(null)
    setNameCol('')
    setPriceCol('')
    setSlugCol('')
    setOptionals({})
    setAttrPairs([])
    setReadError('')
    setFileName('')
    setSelectedField('')
    setPreview(null)
    setResult(null)
    onClose()
  }

  const reset = () => {
    setRawData(null)
    setNameCol('')
    setPriceCol('')
    setSlugCol('')
    setOptionals({})
    setAttrPairs([])
    setReadError('')
    setFileName('')
    setSelectedField('')
    setPreview(null)
    setResult(null)
    setStep('upload')
  }

  const handleDownload = () => {
    api.get('/admin/products/export', { responseType: 'blob' })
      .then(({ data }) => {
        const url = window.URL.createObjectURL(new Blob([data]))
        const a = document.createElement('a')
        a.href = url
        a.download = 'productos.xlsx'
        a.click()
        window.URL.revokeObjectURL(url)
      })
      .catch(() => {
        Alert.fire({ message: 'Error al descargar productos', type: 'error' })
      })
  }

  const renderColumnSelect = (value, onChange, placeholder = '-- No mapear --', includeEmpty = true) => (
    <select value={value || ''} onChange={onChange}
      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 text-sm focus:outline-none focus:border-cyan-500">
      {includeEmpty && <option value="">{placeholder}</option>}
      {rawData.headers.map((h) => (<option key={h} value={h}>{h}</option>))}
    </select>
  )

  return (
    <>
    <Modal open={open} onClose={handleClose} title="Actualización masiva" closable={step !== 'processing'} size="xl">
      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const file = e.dataTransfer.files[0]
              if (file) handleFile(file)
            }}
            className="border-2 border-dashed border-zinc-700 hover:border-cyan-500 rounded-xl p-8 text-center cursor-pointer transition-colors bg-zinc-800/30"
          >
            <FileSpreadsheet className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
            <p className="text-sm text-zinc-400 mb-1">Arrastrá el Excel modificado o clickeá para buscar</p>
            <p className="text-xs text-zinc-600">.xlsx .csv</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.csv,.xls"
            onChange={(e) => {
              const file = e.target.files[0]
              if (file) handleFile(file)
            }}
            className="hidden"
          />

          <button type="button" onClick={handleDownload}
            className="flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
            <Download className="w-3.5 h-3.5" /> Descargar productos actuales
          </button>

          {readError && (
            <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {readError}
            </div>
          )}

          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={handleClose}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* Step 2: Select field */}
      {step === 'field' && (
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">
            Elegí qué campo querés actualizar. Se aplica de a un campo por operación.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {UPDATE_FIELDS.map(({ key, label }) => {
              const checked = selectedField === key
              return (
                <label key={key}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg border cursor-pointer transition-colors
                    ${checked
                      ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                      : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600'}`}
                >
                  <input type="radio" name="updateField" checked={checked} onChange={() => setSelectedField(key)} className="sr-only" />
                  <span className="text-sm">{label}</span>
                </label>
              )
            })}
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="secondary" onClick={reset}>Volver</Button>
            <Button type="button" onClick={() => setStep('mapping')} disabled={!selectedField}>
              Continuar
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Mapping */}
      {step === 'mapping' && rawData && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <FileSpreadsheet className="w-4 h-4" />
            <span className="text-zinc-500">{fileName}</span>
            <span className="text-zinc-600">—</span>
            <span className="text-zinc-400">{rawData.rows.length} filas</span>
          </div>

          <p className="text-sm text-zinc-400">Verificá qué columna corresponde a cada campo:</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">
                Slug (identificador) <span className="text-red-400">*</span>
              </label>
              {renderColumnSelect(slugCol, (e) => setSlugCol(e.target.value), '-- Elegir columna --')}
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">
                Nombre (opcional)
              </label>
              {renderColumnSelect(nameCol, (e) => setNameCol(e.target.value))}
            </div>
            {selectedFieldDef && (
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">
                  {selectedFieldDef.label} <span className="text-red-400">*</span>
                </label>
                {selectedField === 'retailPrice'
                  ? renderColumnSelect(priceCol, (e) => setPriceCol(e.target.value), '-- Elegir columna --')
                  : renderColumnSelect(optionals[selectedField] || '', (e) => setOptionals(prev => ({ ...prev, [selectedField]: e.target.value || null })), '-- Elegir columna --')}
              </div>
            )}
          </div>

          {attrPairs.length > 0 && (
            <div className="px-4 py-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-sm">
              <p className="text-cyan-400 font-medium mb-1">Atributos detectados en el archivo:</p>
              <p className="text-cyan-300/80">
                {attrPairs.length} par{attrPairs.length !== 1 ? 'es' : ''} de atributo/valor.
              </p>
            </div>
          )}

          {errors.length > 0 && (
            <div className="px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm space-y-1">
              <p className="font-medium flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-4 h-4" />
                {errors.length} fila{errors.length > 1 ? 's' : ''} con problemas:
              </p>
              {errors.slice(0, 10).map((e, i) => <p key={i}>• {e}</p>)}
              {errors.length > 10 && <p>… y {errors.length - 10} más.</p>}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="secondary" onClick={() => setStep('field')}>Volver</Button>
            <Button type="button" onClick={handlePreview} disabled={parsed.length === 0 || !fieldCol || previewLoading}>
              {previewLoading ? 'Comparando...' : `Continuar (${parsed.length} productos)`}
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Preview diff */}
      {step === 'preview' && (
        <div className="space-y-4">
          <div className="px-4 py-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-sm">
            <p className="text-cyan-300/80">
              Campo: {selectedFieldDef?.label}
              {preview && <span className="text-cyan-500"> · {preview.total} productos revisados</span>}
            </p>
          </div>

          {flatDiffs.length === 0 ? (
            <div className="px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
              No hay cambios detectados en el campo seleccionado.
            </div>
          ) : (
            <>
              <p className="text-center text-cyan-400 font-medium">
                Se actualizarán {preview.diffs.length} producto{preview.diffs.length !== 1 ? 's' : ''}
              </p>

              {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">
                    {previewPage * PREVIEW_SIZE - PREVIEW_SIZE + 1}–{Math.min(previewPage * PREVIEW_SIZE, flatDiffs.length)} de {flatDiffs.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPreviewPage((p) => Math.max(1, p - 1))} disabled={previewPage === 1}
                      className="px-2 py-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs">
                      Anterior
                    </button>
                    <span className="text-zinc-600 text-xs">{previewPage}/{totalPages}</span>
                    <button onClick={() => setPreviewPage((p) => Math.min(totalPages, p + 1))} disabled={previewPage === totalPages}
                      className="px-2 py-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs">
                      Siguiente
                    </button>
                  </div>
                </div>
              )}

              <div className="max-h-72 overflow-y-auto border border-zinc-800 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-900 sticky top-0">
                    <tr className="text-zinc-500 text-xs uppercase tracking-wider">
                      <th className="text-left px-3 py-2 font-medium">Producto</th>
                      <th className="text-right px-3 py-2 font-medium">Actual</th>
                      <th className="text-right px-3 py-2 font-medium">Nuevo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {pagedDiffs.map((d, i) => (
                      <tr key={i} className="text-zinc-300">
                        <td className="px-3 py-2 truncate max-w-[240px]">
                          <span className="text-xs text-zinc-500 block font-mono">{d.slug}</span>
                          <span>{d.name}</span>
                          {d.variant && <span className="text-xs text-zinc-500 block">{d.variant}</span>}
                        </td>
                        <td className="px-3 py-2 text-right text-zinc-500 line-through tabular-nums">
                          {formatFieldValue(selectedField, d.oldValue)}
                        </td>
                        <td className="px-3 py-2 text-right text-cyan-400 tabular-nums">
                          {formatFieldValue(selectedField, d.newValue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="secondary" onClick={() => setStep('mapping')}>Volver</Button>
            <Button type="button" onClick={handleSubmit} disabled={flatDiffs.length === 0}>
              Actualizar {preview?.diffs?.length || 0} producto{(preview?.diffs?.length || 0) !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      )}

      {/* Processing */}
      {step === 'processing' && (
        <div className="text-center py-8">
          <Spinner size="lg" />
          <p className="text-zinc-300 font-medium mt-4">Actualizando productos...</p>
          <p className="text-zinc-500 text-sm mt-1">No cierres esta ventana.</p>
        </div>
      )}

      {/* Results */}
      {step === 'results' && result && (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-emerald-400 font-medium text-lg">{result.updated} producto{result.updated !== 1 ? 's' : ''} actualizado{result.updated !== 1 ? 's' : ''}</p>
            {result.skipped > 0 && (
              <p className="text-sm text-amber-400 mt-1">{result.skipped} omitido{result.skipped !== 1 ? 's' : ''}</p>
            )}
            {result.skipped === 0 && (
              <p className="text-sm text-zinc-500 mt-1">Sin omisiones</p>
            )}
          </div>

          {result.warnings?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <p className="text-sm text-amber-400 font-medium">
                  {result.warnings.length} advertencia{result.warnings.length > 1 ? 's' : ''}:
                </p>
              </div>
              <div className="max-h-52 overflow-y-auto border border-zinc-800 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-900 sticky top-0">
                    <tr className="text-zinc-500 text-xs uppercase tracking-wider">
                      <th className="text-left px-3 py-2 font-medium">Producto</th>
                      <th className="text-left px-3 py-2 font-medium">Motivo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {result.warnings.map((w, i) => (
                      <tr key={i} className="text-zinc-300">
                        <td className="px-3 py-2 truncate max-w-[200px] font-mono text-xs">{w.slug}</td>
                        <td className="px-3 py-2 text-zinc-400">{w.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button type="button" onClick={handleClose}>Entendido</Button>
          </div>
        </div>
      )}
    </Modal>
    <LoadingOverlay
      open={step === 'processing'}
      message="Actualizando productos..."
      description="No cierres esta ventana."
    />
    </>
  )
}
