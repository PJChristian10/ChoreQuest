import styles from "./TitleBanner.module.css";

export function TitleBanner(): JSX.Element {
  return (
    <div className={styles.banner} aria-label="ChoreQuest">
      {/* Animated portal rings */}
      <div className={styles.rings} aria-hidden="true">
        <span className={styles.ring} />
        <span className={styles.ring} />
        <span className={styles.ring} />
      </div>

      {/* Gothic title */}
      <h1 className={styles.title} aria-hidden="true">
        ChoreQuest
      </h1>
    </div>
  );
}
