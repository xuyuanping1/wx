<template>
  <view class="picker-wrap">
    <view class="picker-col" v-for="(col, ci) in columns" :key="ci">
      <view class="picker-mask-top" />
      <view class="picker-mask-bottom" />
      <view class="picker-highlight" />
      <scroll-view class="picker-scroll" scroll-y
                    :scroll-top="scrollTop[ci]"
                    @scroll="e => onScroll(ci, e)">
        <view class="picker-pad" />
        <view v-for="(item, i) in col.items" :key="i"
              class="picker-item"
              @tap="onTap(ci, i)">
          <text class="picker-text" :class="item === col.current ? 'picker-active' : ''">
            {{ item }}{{ col.suffix }}
          </text>
        </view>
        <view class="picker-pad" />
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  minYear: { type: Number, default: 2000 },
})
const emit = defineEmits(['update:modelValue'])

const ITEM_H = 42
const now = new Date()
const sel = ref([now.getFullYear(), now.getMonth() + 1, now.getDate()])

function makeYears() {
  const a = []
  for (let y = props.minYear; y <= now.getFullYear(); y++) a.push(y)
  return a
}
function makeDays() { return Array.from({ length: new Date(sel.value[0], sel.value[1], 0).getDate() }, (_, i) => i + 1) }

const columns = reactive([
  { items: makeYears(), current: sel.value[0], suffix: '年' },
  { items: Array.from({ length: 12 }, (_, i) => i + 1), current: sel.value[1], suffix: '月' },
  { items: makeDays(), current: sel.value[2], suffix: '日' },
])

const scrollTop = reactive([
  (sel.value[0] - props.minYear) * ITEM_H,
  (sel.value[1] - 1) * ITEM_H,
  (sel.value[2] - 1) * ITEM_H,
])

function onScroll(ci, e) {
  const top = e.detail.scrollTop
  const idx = Math.round(top / ITEM_H)
  const col = columns[ci]
  if (idx >= 0 && idx < col.items.length && col.items[idx] !== col.current) {
    col.current = col.items[idx]
    applySelection(ci)
  }
}

function onTap(ci, idx) {
  const col = columns[ci]
  col.current = col.items[idx]
  const newSt = [...scrollTop]
  newSt[ci] = idx * ITEM_H
  scrollTop.splice(0, 3, ...newSt)
  applySelection(ci)
}

function applySelection(ci) {
  sel.value[ci] = columns[ci].current
  if (ci !== 2) {
    const md = new Date(sel.value[0], sel.value[1], 0).getDate()
    columns[2].items = makeDays()
    if (sel.value[2] > md) {
      sel.value[2] = md
      columns[2].current = md
      const ns = [...scrollTop]
      ns[2] = (md - 1) * ITEM_H
      scrollTop.splice(0, 3, ...ns)
    }
  }
  emitVal()
}

function emitVal() {
  emit('update:modelValue',
    `${sel.value[0]}-${String(sel.value[1]).padStart(2, '0')}-${String(sel.value[2]).padStart(2, '0')}`
  )
}

onMounted(() => nextTick(() => emitVal()))
</script>

<style scoped>
.picker-wrap {
  display: flex;
  justify-content: center;
  gap: 2px;
  margin: 0 4px;
  position: relative;
}
.picker-col {
  flex: 1;
  height: 210px;
  overflow: hidden;
  border-radius: 12px;
  position: relative;
}
.picker-highlight {
  position: absolute;
  top: 50%;
  left: 4px;
  right: 4px;
  height: 42px;
  margin-top: -21px;
  background: rgba(232, 160, 180, 0.08);
  border-top: 1px solid rgba(232, 160, 180, 0.15);
  border-bottom: 1px solid rgba(232, 160, 180, 0.15);
  border-radius: 8px;
  pointer-events: none;
  z-index: 2;
}
.picker-mask-top {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 84px;
  background: linear-gradient(to bottom, rgba(255,255,255,0.9), transparent);
  pointer-events: none;
  z-index: 1;
}
.picker-mask-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 84px;
  background: linear-gradient(to top, rgba(255,255,255,0.9), transparent);
  pointer-events: none;
  z-index: 1;
}
.picker-scroll {
  width: 100%;
  height: 100%;
}
.picker-pad {
  height: 84px;
}
.picker-item {
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.picker-text {
  font-size: 16px;
  color: #C4BFC8;
  font-weight: 400;
  line-height: 42px;
  transition: all 0.1s ease;
}
.picker-active {
  font-size: 20px;
  color: #C47A92;
  font-weight: 700;
}

/* 隐藏滚动条 */
.picker-scroll ::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}
</style>
