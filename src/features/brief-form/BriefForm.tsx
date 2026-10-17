import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { usePage } from '../../app/PageContext';
import { Button } from '../../components/Button';
import { ButtonLink } from '../../components/ButtonLink';
import { serviceIds } from '../../content/services';
import {
  buildMessage,
  copyText,
  destinationUrl,
  emptyBrief,
  FIELD_ORDER,
  LIMITS,
  parseProjectType,
  validateBrief,
  type BriefErrors,
  type BriefField,
  type BriefValues,
  type ContactMethod,
  type ProjectType,
} from './brief';
import styles from './BriefForm.module.css';
import { useQueryParam } from './useQueryParam';

type CopyState = 'idle' | 'copying' | 'copied' | 'failed';

/**
 * Static-hosting brief: nothing is sent to a server. The form composes a message,
 * shows it in full, and hands it to Telegram (prefilled + copied) or Instagram (copied).
 * The status never claims delivery — only the visitor can press "send".
 */
export function BriefForm() {
  const { t } = usePage();
  const f = t.form;
  const uid = useId();
  const idFor = (field: string) => `${uid}-${field}`;

  const queryType = parseProjectType(useQueryParam('type'));
  const [values, setValues] = useState<BriefValues>(() => emptyBrief());
  const [touchedType, setTouchedType] = useState(false);
  const [errors, setErrors] = useState<BriefErrors>({});
  const [preview, setPreview] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const [opened, setOpened] = useState(false);

  const form = useRef<HTMLFormElement>(null);
  const previewHeading = useRef<HTMLHeadingElement>(null);
  const previewText = useRef<HTMLTextAreaElement>(null);

  // A ?type= link preselects the project type until the visitor picks one.
  const effective: BriefValues = {
    ...values,
    type: touchedType ? values.type : values.type || queryType,
  };

  function update<K extends keyof BriefValues>(key: K, value: BriefValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    if (key === 'type') setTouchedType(true);
    // Editing a field clears its error; the rest stay until the next submit.
    if (key in errors) {
      setErrors(
        (current) =>
          Object.fromEntries(
            Object.entries(current).filter(([field]) => field !== key),
          ) as BriefErrors,
      );
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validateBrief(effective);
    setErrors(found);
    const first = FIELD_ORDER.find((field) => found[field]);
    if (first) {
      const target = form.current?.querySelector<HTMLElement>(`[data-field="${first}"]`);
      target?.focus();
      return;
    }
    setPreview(buildMessage(effective, t));
    setCopyState('idle');
    setOpened(false);
  }

  // Move focus with the view switch so keyboard and screen-reader users land
  // on the new content (preview heading, or the first field when editing again).
  const hasPreview = preview !== null;
  const previousHasPreview = useRef(hasPreview);
  useEffect(() => {
    if (previousHasPreview.current === hasPreview) return; // mount (and StrictMode re-run)
    previousHasPreview.current = hasPreview;
    if (hasPreview) previewHeading.current?.focus();
    else form.current?.querySelector<HTMLElement>('[data-field="name"]')?.focus();
  }, [hasPreview]);

  async function onSend() {
    if (!preview) return;
    setOpened(true);
    setCopyState('copying');
    const ok = await copyText(preview, previewText.current);
    setCopyState(ok ? 'copied' : 'failed');
  }

  function backToForm() {
    setPreview(null);
  }

  const errorText = (field: BriefField) => {
    const key = errors[field];
    return key ? f.errors[key] : null;
  };
  const describedBy = (...ids: (string | false)[]) => ids.filter(Boolean).join(' ') || undefined;

  if (preview !== null) {
    const method = effective.method;
    return (
      <section className={styles.preview} aria-labelledby={idFor('preview-heading')}>
        <h2
          id={idFor('preview-heading')}
          ref={previewHeading}
          tabIndex={-1}
          className={styles.previewHeading}
        >
          {f.preview.heading}
        </h2>
        <p className={styles.hint}>{f.preview.intro}</p>
        <label className="visually-hidden" htmlFor={idFor('message')}>
          {f.preview.heading}
        </label>
        <textarea
          id={idFor('message')}
          ref={previewText}
          className={styles.message}
          value={preview}
          readOnly
          rows={Math.min(14, preview.split('\n').length + 2)}
        />
        <div className={styles.actions}>
          <ButtonLink href={destinationUrl(method, preview)} external size="l" onClick={onSend}>
            {method === 'telegram' ? f.preview.sendTelegram : f.preview.sendInstagram}
          </ButtonLink>
          <Button variant="secondary" size="l" icon={false} onClick={backToForm}>
            {f.preview.edit}
          </Button>
        </div>
        <div className={styles.status} role="status" aria-live="polite">
          {copyState === 'copying' && <p>{f.preview.copying}</p>}
          {copyState === 'copied' && <p>{f.preview.copied}</p>}
          {copyState === 'failed' && <p className={styles.warning}>{f.preview.copyFailed}</p>}
          {opened && (
            <p>{method === 'telegram' ? f.preview.statusTelegram : f.preview.statusInstagram}</p>
          )}
        </div>
      </section>
    );
  }

  const projectTypes: { value: ProjectType; label: string }[] = [
    ...serviceIds.map((id) => ({ value: id, label: t.services.items[id].name })),
    { value: 'other', label: f.projectType.other },
  ];
  const methods: ContactMethod[] = ['telegram', 'instagram'];

  return (
    <form ref={form} className={styles.form} noValidate onSubmit={onSubmit} aria-label={f.legend}>
      {/* Name */}
      <div className={styles.field}>
        <label className={styles.label} htmlFor={idFor('name')}>
          {f.name.label} <span className={styles.req}>({f.required})</span>
        </label>
        <input
          id={idFor('name')}
          data-field="name"
          className={styles.input}
          type="text"
          name="name"
          autoComplete="name"
          maxLength={LIMITS.name}
          placeholder={f.name.autocompleteHint}
          value={values.name}
          onChange={(e) => update('name', e.target.value)}
          aria-required="true"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={describedBy(Boolean(errors.name) && idFor('name-error'))}
        />
        {errorText('name') && (
          <p id={idFor('name-error')} className={styles.error}>
            {errorText('name')}
          </p>
        )}
      </div>

      {/* Project type */}
      <fieldset
        className={styles.fieldset}
        aria-describedby={describedBy(Boolean(errors.type) && idFor('type-error'))}
      >
        <legend className={styles.label}>
          {f.projectType.label} <span className={styles.req}>({f.required})</span>
        </legend>
        <div className={styles.chips}>
          {projectTypes.map((option, i) => (
            <label key={option.value} className={styles.chip}>
              <input
                type="radio"
                name="type"
                value={option.value}
                data-field={i === 0 ? 'type' : undefined}
                checked={effective.type === option.value}
                onChange={() => update('type', option.value)}
                aria-invalid={Boolean(errors.type)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
        {errorText('type') && (
          <p id={idFor('type-error')} className={styles.error}>
            {errorText('type')}
          </p>
        )}
      </fieldset>

      {/* Description */}
      <div className={styles.field}>
        <label className={styles.label} htmlFor={idFor('description')}>
          {f.description.label} <span className={styles.req}>({f.required})</span>
        </label>
        <p id={idFor('description-hint')} className={styles.hint}>
          {f.description.hint}
        </p>
        <textarea
          id={idFor('description')}
          data-field="description"
          className={`${styles.input} ${styles.textarea}`}
          name="description"
          rows={5}
          maxLength={LIMITS.description}
          value={values.description}
          onChange={(e) => update('description', e.target.value)}
          aria-required="true"
          aria-invalid={Boolean(errors.description)}
          aria-describedby={describedBy(
            idFor('description-hint'),
            Boolean(errors.description) && idFor('description-error'),
          )}
        />
        <p className={styles.counter} aria-hidden="true">
          {f.description.counter
            .replace('{count}', String(values.description.length))
            .replace('{max}', String(LIMITS.description))}
        </p>
        {errorText('description') && (
          <p id={idFor('description-error')} className={styles.error}>
            {errorText('description')}
          </p>
        )}
      </div>

      {/* Budget */}
      <div className={styles.field}>
        <label className={styles.label} htmlFor={idFor('budget')}>
          {f.budget.label} <span className={styles.req}>({f.optional})</span>
        </label>
        <p id={idFor('budget-hint')} className={styles.hint}>
          {f.budget.hint}
        </p>
        <input
          id={idFor('budget')}
          data-field="budget"
          className={styles.input}
          type="text"
          name="budget"
          maxLength={LIMITS.budget}
          value={values.budget}
          onChange={(e) => update('budget', e.target.value)}
          aria-invalid={Boolean(errors.budget)}
          aria-describedby={describedBy(
            idFor('budget-hint'),
            Boolean(errors.budget) && idFor('budget-error'),
          )}
        />
        {errorText('budget') && (
          <p id={idFor('budget-error')} className={styles.error}>
            {errorText('budget')}
          </p>
        )}
      </div>

      {/* Contact method */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.label}>{f.contactMethod.label}</legend>
        <div className={styles.chips}>
          {methods.map((method) => (
            <label key={method} className={styles.chip}>
              <input
                type="radio"
                name="method"
                value={method}
                checked={values.method === method}
                onChange={() => update('method', method)}
              />
              <span>{f.contactMethod[method]}</span>
            </label>
          ))}
        </div>
        {values.method === 'instagram' && (
          <p className={styles.hint}>{f.contactMethod.instagramHint}</p>
        )}
      </fieldset>

      <Button type="submit" size="l">
        {f.submit}
      </Button>
    </form>
  );
}
