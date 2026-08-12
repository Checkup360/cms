'use client'
import React from 'react'
import {
  $isListNode,
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_CHECK_LIST_COMMAND,
  ListItemNode,
  ListNode,
} from '@payloadcms/richtext-lexical/lexical/list'
import { $isRangeSelection, BaseSelection } from '@payloadcms/richtext-lexical/lexical'
import { createClientFeature } from '@payloadcms/richtext-lexical/client'
import { ListPlugin } from '@payloadcms/richtext-lexical/lexical/react/LexicalListPlugin'
import { CheckListPlugin } from '@payloadcms/richtext-lexical/lexical/react/LexicalCheckListPlugin'
import { UNORDERED_LIST, ORDERED_LIST, CHECK_LIST } from '@payloadcms/richtext-lexical/lexical/markdown'

// Wrap Lexical Plugins to match Payload's expected PluginComponent signature
const CustomListPlugin = () => <ListPlugin />
const CustomCheckListPlugin = () => <CheckListPlugin />

// Inline SVG Icons to match Payload style
export const ListIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
)

export const OrderedListIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="10" y1="6" x2="21" y2="6" />
    <line x1="10" y1="12" x2="21" y2="12" />
    <line x1="10" y1="18" x2="21" y2="18" />
    <path d="M4 6h1v4" />
    <path d="M4 10h2" />
    <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
  </svg>
)

export const ChecklistIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m9 11 3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
)

// Helper to check if a specific list type is active
const isListActive = (selection: BaseSelection | null, listType: 'bullet' | 'number' | 'check') => {
  if (!selection || !$isRangeSelection(selection)) {
    return false
  }
  for (const node of selection.getNodes()) {
    if ($isListNode(node) && node.getListType() === listType) {
      continue
    }
    const parent = node.getParent()
    if ($isListNode(parent) && parent.getListType() === listType) {
      continue
    }
    const parentParent = parent?.getParent()
    if ($isListNode(parentParent) && parentParent.getListType() === listType) {
      continue
    }
    return false
  }
  return true
}

export const UnorderedListFeatureClient = createClientFeature({
  markdownTransformers: [UNORDERED_LIST],
  nodes: [ListNode, ListItemNode],
  plugins: [
    {
      Component: CustomListPlugin,
      position: 'normal',
    },
  ],
  slashMenu: {
    groups: [
      {
        key: 'lists',
        label: 'Lists',
        items: [
          {
            key: 'unorderedList',
            keywords: ['unordered list', 'ul', 'bullet list'],
            label: 'Bullet List',
            Icon: ListIcon,
            onSelect: ({ editor }) => {
              editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
            },
          },
        ],
      },
    ],
  },
  toolbarFixed: {
    groups: [
      {
        key: 'lists',
        type: 'dropdown',
        ChildComponent: ListIcon,
        order: 28,
        items: [
          {
            key: 'unorderedList',
            label: 'Bullet List',
            ChildComponent: ListIcon,
            isActive: ({ selection }) => isListActive(selection, 'bullet'),
            onSelect: ({ editor }) => {
              editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
            },
          },
        ],
      },
    ],
  },
  toolbarInline: {
    groups: [
      {
        key: 'lists',
        type: 'dropdown',
        ChildComponent: ListIcon,
        order: 28,
        items: [
          {
            key: 'unorderedList',
            label: 'Bullet List',
            ChildComponent: ListIcon,
            isActive: ({ selection }) => isListActive(selection, 'bullet'),
            onSelect: ({ editor }) => {
              editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
            },
          },
        ],
      },
    ],
  },
})

export const OrderedListFeatureClient = createClientFeature({
  markdownTransformers: [ORDERED_LIST],
  nodes: [ListNode, ListItemNode],
  plugins: [
    {
      Component: CustomListPlugin,
      position: 'normal',
    },
  ],
  slashMenu: {
    groups: [
      {
        key: 'lists',
        label: 'Lists',
        items: [
          {
            key: 'orderedList',
            keywords: ['ordered list', 'ol', 'numbered list'],
            label: 'Numbered List',
            Icon: OrderedListIcon,
            onSelect: ({ editor }) => {
              editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
            },
          },
        ],
      },
    ],
  },
  toolbarFixed: {
    groups: [
      {
        key: 'lists',
        type: 'dropdown',
        ChildComponent: ListIcon,
        order: 28,
        items: [
          {
            key: 'orderedList',
            label: 'Numbered List',
            ChildComponent: OrderedListIcon,
            isActive: ({ selection }) => isListActive(selection, 'number'),
            onSelect: ({ editor }) => {
              editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
            },
          },
        ],
      },
    ],
  },
  toolbarInline: {
    groups: [
      {
        key: 'lists',
        type: 'dropdown',
        ChildComponent: ListIcon,
        order: 28,
        items: [
          {
            key: 'orderedList',
            label: 'Numbered List',
            ChildComponent: OrderedListIcon,
            isActive: ({ selection }) => isListActive(selection, 'number'),
            onSelect: ({ editor }) => {
              editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
            },
          },
        ],
      },
    ],
  },
})

export const ChecklistFeatureClient = createClientFeature({
  markdownTransformers: [CHECK_LIST],
  nodes: [ListNode, ListItemNode],
  plugins: [
    {
      Component: CustomCheckListPlugin,
      position: 'normal',
    },
  ],
  slashMenu: {
    groups: [
      {
        key: 'lists',
        label: 'Lists',
        items: [
          {
            key: 'checklist',
            keywords: ['checklist', 'check', 'todo'],
            label: 'Checklist',
            Icon: ChecklistIcon,
            onSelect: ({ editor }) => {
              editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)
            },
          },
        ],
      },
    ],
  },
  toolbarFixed: {
    groups: [
      {
        key: 'lists',
        type: 'dropdown',
        ChildComponent: ListIcon,
        order: 28,
        items: [
          {
            key: 'checklist',
            label: 'Checklist',
            ChildComponent: ChecklistIcon,
            isActive: ({ selection }) => isListActive(selection, 'check'),
            onSelect: ({ editor }) => {
              editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)
            },
          },
        ],
      },
    ],
  },
  toolbarInline: {
    groups: [
      {
        key: 'lists',
        type: 'dropdown',
        ChildComponent: ListIcon,
        order: 28,
        items: [
          {
            key: 'checklist',
            label: 'Checklist',
            ChildComponent: ChecklistIcon,
            isActive: ({ selection }) => isListActive(selection, 'check'),
            onSelect: ({ editor }) => {
              editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)
            },
          },
        ],
      },
    ],
  },
})
