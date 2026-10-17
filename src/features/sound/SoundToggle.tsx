import { useSyncExternalStore } from 'react';
import { usePage } from '../../app/PageContext';
import { sound } from './engine';
import styles from './SoundToggle.module.css';

const OFF = { enabled: false, volume: 0.55 };

/** Visible ON/OFF control with a restrained volume slider. Off by default. */
export function SoundToggle() {
  const { t } = usePage();
  // Server snapshot is "off", so prerendered HTML and hydration agree; the
  // session's stored choice appears right after hydration.
  const state = useSyncExternalStore(sound.subscribe, sound.getSnapshot, () => OFF);

  return (
    <div className={styles.wrap} data-on={state.enabled || undefined}>
      <button
        type="button"
        className={styles.toggle}
        aria-pressed={state.enabled}
        aria-label={t.experience.soundLabel}
        onClick={() => void sound.toggle()}
      >
        <span className={styles.bars} aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </span>
        <span className={styles.text} aria-hidden="true">
          {state.enabled ? t.experience.soundOn : t.experience.soundOff}
        </span>
      </button>
      {state.enabled && (
        <input
          className={styles.volume}
          type="range"
          min={0}
          max={100}
          step={5}
          value={Math.round(state.volume * 100)}
          aria-label={t.experience.volume}
          onChange={(event) => sound.setVolume(Number(event.target.value) / 100)}
        />
      )}
    </div>
  );
}
