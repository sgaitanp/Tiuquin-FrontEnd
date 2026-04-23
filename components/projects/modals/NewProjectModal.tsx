import { useState, type FormEvent } from 'react';
import Modal from '../common/Modal';
import { Lbl, Err, FooterBtns, inp } from '../common/shared';

/**
 * Small modal that captures the two fields needed to create a
 * project (name + client). Survey rows are added afterwards from
 * the project row's expand view.
 */
export default function NewProjectModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (data: { name: string; client: string }) => void;
}) {
  const [f, setF] = useState<Record<string, string>>({ name: '', client: '' });
  const [e, setE] = useState<Record<string, string>>({});
  const s = (k: string, v: string) => {
    setF((x) => ({ ...x, [k]: v }));
    setE((x) => ({ ...x, [k]: '' }));
  };
  const sub = (ev: FormEvent) => {
    ev.preventDefault();
    const err: Record<string, string> = {};
    if (!f.name.trim()) err.name = 'Required';
    if (!f.client.trim()) err.client = 'Required';
    if (Object.keys(err).length) {
      setE(err);
      return;
    }
    onCreated({ name: f.name, client: f.client });
    onClose();
  };
  return (
    <Modal
      title="New Project"
      subtitle="Create a project. Add surveys afterwards."
      onClose={onClose}
      maxWidth={420}
    >
      <form
        onSubmit={sub}
        noValidate
        style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
      >
        <div>
          <Lbl t="Project Name" />
          <input
            value={f.name}
            onChange={(ev) => s('name', ev.target.value)}
            placeholder="e.g. Downtown Solar Array"
            style={inp(!!e.name)}
          />
          <Err msg={e.name} />
        </div>
        <div>
          <Lbl t="Client" />
          <input
            value={f.client}
            onChange={(ev) => s('client', ev.target.value)}
            placeholder="e.g. Helios Energy Corp"
            style={inp(!!e.client)}
          />
          <Err msg={e.client} />
        </div>
        <FooterBtns onCancel={onClose} submitLabel="Create Project" />
      </form>
    </Modal>
  );
}
