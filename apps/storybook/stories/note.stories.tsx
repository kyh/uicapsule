import { Note } from './note';
import type { NoteProps } from './note';
import type { Meta } from '@storybook/react';

const meta: Meta = {
  title: 'Components / Note',
  component: Note,
};

export function Example(props: NoteProps) {
  return (
    <Note {...props}>
      <Note.Label>This note details some information.</Note.Label>
    </Note>
  );
}

export function WithoutLabel(props: NoteProps) {
  return <Note {...props}>This note details some information.</Note>;
}

export function WithCustomPrefix(props: NoteProps) {
  return (
    <Note {...props}>
      <Note.Label prefix="Notification">
        This note details some information.
      </Note.Label>
    </Note>
  );
}

export default meta;
