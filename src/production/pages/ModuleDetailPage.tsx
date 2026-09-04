import { useEffect, useState } from 'react'
import { ArrowLeft, Plus } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { AskAiButton } from '@/ai/components/AskAiButton'
import { useTasksStore } from '@/tasks/store'
import { TaskDetailDrawer } from '@/tasks/components/TaskDetailDrawer'
import { CreateTaskModal } from '@/tasks/components/CreateTaskModal'
import { Task, TASK_STATES } from '@/tasks/types'
import * as warehouseApi from '@/warehouse/api'
import { Material } from '@/warehouse/types'
import { Button } from '@/shared/ui/Button'
import { Chip } from '@/shared/ui/Chip'
import { DataTable } from '@/shared/ui/DataTable'
import { useProductionStore } from '../store'
import { AddMaterialModal } from '../components/AddMaterialModal'
import { RequestMaterialModal } from '../components/RequestMaterialModal'
import { ModuleMaterial } from '../types'

export function ModuleDetailPage() {
  const { id = '' } = useParams()
  const moduleId = Number(id)
  const module = useProductionStore((s) => s.module)
  const loadModule = useProductionStore((s) => s.loadModule)
  const tasks = useTasksStore((s) => s.tasks)
  const loadTasks = useTasksStore((s) => s.load)

  const [materials, setMaterials] = useState<Material[]>([])
  const [addingMaterial, setAddingMaterial] = useState(false)
  const [requestingLine, setRequestingLine] = useState<ModuleMaterial | null>(null)
  const [creatingTask, setCreatingTask] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  useEffect(() => {
    loadModule(moduleId)
    loadTasks({ module_id: moduleId })
    warehouseApi.listMaterials().then(setMaterials)
  }, [moduleId, loadModule, loadTasks])

  if (!module || module.id !== moduleId) {
    return <p className="text-[13px] text-muted">Загрузка…</p>
  }

  function materialTitle(warehouseMaterialId: number) {
    return materials.find((m) => m.id === warehouseMaterialId)?.title ?? `Материал №${warehouseMaterialId}`
  }

  const moduleTasks = tasks.filter((t) => t.module_id === moduleId)

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to={`/production/${module.production_id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink"
      >
        <ArrowLeft size={14} />
        К производству
      </Link>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[18px] font-medium text-ink">{module.name}</h1>
          {module.description && <p className="mt-1 text-[13px] text-muted">{module.description}</p>}
        </div>
        <AskAiButton
          domain="production"
          contextLabel={`Модуль: ${module.name}`}
          contextPrefix={`[module_id=${module.id}, production_id=${module.production_id}, ${module.name}] `}
        />
      </div>

      <section className="mb-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[14px] font-medium text-ink">Материалы</h2>
          <Button size="sm" variant="secondary" onClick={() => setAddingMaterial(true)}>
            <Plus size={14} />
            Добавить материал
          </Button>
        </div>
        <DataTable
          columns={[
            { header: 'Материал', accessor: (m: ModuleMaterial) => materialTitle(m.warehouse_material_id) },
            { header: 'Инв. №', accessor: (m: ModuleMaterial) => m.inventory_number },
            { header: 'Необходимо', align: 'right', className: 'tabular', accessor: (m: ModuleMaterial) => `${m.quantity_required} ${m.unit}` },
            { header: 'Запрошено', align: 'right', className: 'tabular', accessor: (m: ModuleMaterial) => `${m.quantity_requested} ${m.unit}` },
            { header: 'Выдано', align: 'right', className: 'tabular', accessor: (m: ModuleMaterial) => `${m.quantity_provided} ${m.unit}` },
            {
              header: '',
              accessor: (m: ModuleMaterial) => (
                <Button size="sm" variant="ghost" onClick={() => setRequestingLine(m)}>
                  Запросить
                </Button>
              ),
            },
          ]}
          rows={module.materials}
          keyOf={(m) => String(m.id)}
          emptyLabel="Материалы пока не добавлены"
        />
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[14px] font-medium text-ink">Задачи модуля</h2>
          <Button size="sm" variant="secondary" onClick={() => setCreatingTask(true)}>
            <Plus size={14} />
            Задача
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          {moduleTasks.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => setSelectedTask(task)}
              className="flex items-center justify-between rounded-md border border-border bg-surface px-4 py-3 text-left hover:border-brand/40"
            >
              <span className="text-[13px] text-ink">{task.title}</span>
              <Chip tone="neutral">{TASK_STATES.find((s) => s.key === task.status)?.label}</Chip>
            </button>
          ))}
          {moduleTasks.length === 0 && <p className="text-[13px] text-muted">Задач пока нет.</p>}
        </div>
      </section>

      <AddMaterialModal
        moduleId={module.id}
        materials={materials}
        open={addingMaterial}
        onClose={() => setAddingMaterial(false)}
      />
      <RequestMaterialModal line={requestingLine} onClose={() => setRequestingLine(null)} />
      <CreateTaskModal moduleId={module.id} open={creatingTask} onClose={() => setCreatingTask(false)} />
      <TaskDetailDrawer task={selectedTask} onClose={() => setSelectedTask(null)} />
    </div>
  )
}
