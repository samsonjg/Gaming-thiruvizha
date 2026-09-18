import { useEffect, useState } from 'react'
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { QuestionComponentProps } from './types'
import type { QuestionOption } from '../../types/schema'

function RankRow({ option, index }: { option: QuestionOption; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: option.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={`flex min-h-[56px] items-center gap-3 rounded-2xl border-2 border-white/10 bg-white/5 px-4 py-3 ${
        isDragging ? 'opacity-70 border-gt-violet-400' : ''
      }`}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gt-violet-500/30 text-sm font-bold text-white">
        {index + 1}
      </span>
      {option.emoji && <span className="text-xl">{option.emoji}</span>}
      <span className="flex-1 font-medium text-white/90">{option.label}</span>
      <span className="text-white/30">⠿</span>
    </div>
  )
}

export function RankingQuestion({ options, value, onChange, disabled }: QuestionComponentProps) {
  const initialOrder = value?.kind === 'ranking' && value.order.length ? value.order : options.map((o) => o.id)
  const [order, setOrder] = useState<string[]>(initialOrder)

  useEffect(() => {
    if (!value) onChange({ kind: 'ranking', order: initialOrder })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(TouchSensor))
  const optionMap = new Map(options.map((o) => [o.id, o]))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = order.indexOf(String(active.id))
    const newIndex = order.indexOf(String(over.id))
    const next = arrayMove(order, oldIndex, newIndex)
    setOrder(next)
    onChange({ kind: 'ranking', order: next })
  }

  if (disabled) {
    return (
      <div className="flex flex-col gap-2">
        {order.map((id, idx) => {
          const opt = optionMap.get(id)
          if (!opt) return null
          return <RankRow key={id} option={opt} index={idx} />
        })}
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={order} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {order.map((id, idx) => {
            const opt = optionMap.get(id)
            if (!opt) return null
            return <RankRow key={id} option={opt} index={idx} />
          })}
        </div>
      </SortableContext>
      <p className="mt-2 text-center text-xs text-white/40">Drag to reorder by preference</p>
    </DndContext>
  )
}
