import React from "react";
import styles from "./Logo3ustaquio.module.css";

type LogoProps = {
  size?: "sm" | "md" | "lg";
  withTagline?: boolean;
};

export default function Logo3ustaquio({
  size = "md",
  withTagline = false,
}: LogoProps) {
  return (
    <div className={`${styles.wrapper} ${styles[size]}`}>
      <span className={styles.wordmark}>
        

        <span className={styles.core}>
          <span className={styles.coreText}>3ustaquio</span>          
        </span>
      </span>

      {withTagline && (
        <span className={styles.tagline}>
          O hacker ético da nova economia
        </span>
      )}
    </div>
  );
}
