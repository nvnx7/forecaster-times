import { useId } from "react";

import styles from "./newspaper-loader.module.css";

const phrases = [
  "Setting the type…",
  "Consulting the markets…",
  "Writing tomorrow’s headlines…",
  "Chasing the presses…",
];
const keyboardRows = ["1234567890", "QWERTYUIOP", "ASDFGHJKL;", "ZXCVBNM,./"];

/** Pen-and-ink study of a desktop typewriter, with a working paper carriage. */
export function NewspaperLoader() {
  const hatchId = useId();
  const crosshatchId = useId();

  return (
    <div className={styles.loader} role="status">
      <span className="sr-only">Preparing your newspaper. Please wait.</span>
      <svg
        aria-hidden="true"
        viewBox="0 25 360 280"
        className={styles.illustration}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.15"
      >
        <defs>
          <pattern
            id={hatchId}
            width="4"
            height="4"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(30)"
          >
            <path d="M0 0v4" strokeWidth=".75" opacity=".65" />
          </pattern>
          <pattern
            id={crosshatchId}
            width="5"
            height="5"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="m0 0 5 5m-1-6 2 2m-7 3 2 2M0 5l5-5"
              strokeWidth=".55"
              opacity=".8"
            />
          </pattern>
        </defs>
        <g strokeWidth=".55" opacity=".3">
          <path d="m40 256 188 36 89-48M48 263l169 32m-156-25 140 27m26-10 79-39m-68 45 61-33" />
          <path d="m61 259-9 7m24-4-9 8m26-4-9 8m26-4-9 8m26-4-9 8m26-4-9 8m26-4-9 8m26-4-9 8m26-4-9 8" />
        </g>

        {/* Deep right side and front apron define the reference's silhouette. */}
        <path d="m267 140 42-18-3 111-76 47-2-24Z" className={styles.paper} />
        <path d="m267 145 37-17-3 101-67 42-1-17Z" fill={`url(#${hatchId})`} />
        <path
          d="m269 150 29-14-1 89-57 36M301 133l-2 94-63 40"
          strokeWidth=".65"
        />
        <ellipse
          cx="278"
          cy="208"
          rx="12"
          ry="23"
          transform="rotate(24 278 208)"
          className={styles.paper}
        />
        <ellipse
          cx="279"
          cy="208"
          rx="9"
          ry="19"
          transform="rotate(24 279 208)"
          fill={`url(#${crosshatchId})`}
        />
        <g fill="currentColor" stroke="none">
          <ellipse cx="277" cy="161" rx="1.8" ry="2.7" />
          <ellipse cx="296" cy="151" rx="1.8" ry="2.7" />
          <ellipse cx="296" cy="175" rx="2" ry="3" />
          <ellipse cx="261" cy="245" rx="1.8" ry="2.7" />
          <ellipse cx="297" cy="232" rx="2" ry="3" />
        </g>
        <path
          d="m53 247-1 10 15 3 3-10m144 23-1 10 15 3 4-10m59-35 1 9 12-6v-10"
          fill={`url(#${crosshatchId})`}
        />

        <g className={styles.carriage}>
          <g className={styles.sheet}>
            <path
              d="M153 128q5-39-2-82l116 14q8 34 4 82Z"
              className={styles.paper}
            />
            <path
              d="m154 49 110 14m-108-12q6 27 4 66m102-50q5 25 4 49"
              strokeWidth=".5"
              opacity=".65"
            />
            <g transform="matrix(1 .12 0 1 0 -24.72)">
              <path d="M164 78h89m-89 2h89" strokeWidth=".55" />
              <text x="208" y="91" className={styles.imprint} stroke="none">
                PROBABILITY PRESS
              </text>
              <path d="M164 95h89" strokeWidth=".55" />
              <path
                d="M206 104h5m2 0h6m2 0h4m2 0h7m2 0h4m2 0h4"
                className={styles.lineOne}
                pathLength="80"
              />
              <path
                d="M206 111h4m2 0h7m2 0h6m2 0h4m2 0h5m2 0h4"
                className={styles.lineTwo}
                pathLength="80"
                strokeWidth=".95"
              />
              <path
                d="M206 118h6m2 0h4m2 0h7m2 0h5m2 0h4m2 0h4"
                className={styles.lineThree}
                pathLength="80"
                strokeWidth=".95"
              />
            </g>
          </g>
          {/* Cylindrical platen, metal rail, and ribbed hand wheel. */}
          <path
            d="m127 93 169 20q6 1 6 10t-7 9l-170-20q-7-1-7-10t9-9Z"
            className={styles.paper}
          />
          <path
            d="m126 106 172 20-2 6-171-20Z"
            fill={`url(#${crosshatchId})`}
          />
          <path d="m126 96 169 20m-170-17 172 20" strokeWidth=".65" />
          <ellipse cx="123" cy="102" rx="5" ry="10" className={styles.paper} />
          <path
            d="m119 94-3 1q-6 8 0 17l4 1m179 6 11 1v16l-10-1"
            fill={`url(#${hatchId})`}
          />
          <ellipse cx="310" cy="128" rx="8" ry="14" className={styles.paper} />
          <ellipse
            cx="313"
            cy="129"
            rx="5.5"
            ry="11"
            fill={`url(#${crosshatchId})`}
          />
          <ellipse cx="314" cy="129" rx="2" ry="3.5" className={styles.paper} />
          <path d="m312 118 1 4m3 4 3 1m-3 7 1 4m-5-3-2 3M119 106l-16-3 2-20-12-2" />
          <path d="m90 79 17 2m-16 1 16 2" strokeWidth="1.5" />
        </g>

        {/* Tall sloping casting, with its large, concave type-bar well. */}
        <path d="m86 120 181 26-37 116L47 231Z" className={styles.paper} />
        <path
          d="m91 124 171 25-9 27-173-26Z"
          fill={`url(#${hatchId})`}
          stroke="none"
        />
        <path
          d="m113 130 132 18q-34 42-78 25-31-10-54-43Z"
          className={styles.paper}
        />
        <path
          d="m118 132 122 18q-31 33-71 19-29-9-51-37Z"
          fill={`url(#${crosshatchId})`}
        />
        <g strokeWidth=".85">
          <path d="M130 143q12 17 34 24l15-21m-35 0q10 16 26 23l14-21m-27 1q8 13 21 22l11-21m-20 1q6 13 16 22l10-21m-14 1q4 12 11 20l9-19m-9 1q3 10 7 16l9-16m-8 1 5 13 9-14m-7 1 4 10 9-12" />
        </g>
        <path d="M113 130q25 35 54 43 43 17 78-25" strokeWidth="1.5" />
        <g>
          <path
            d="M101 124v6q13 7 29 3v-6m99 17v6q15 8 29 2v-6"
            fill={`url(#${hatchId})`}
          />
          <ellipse
            cx="116"
            cy="125"
            rx="15"
            ry="5"
            transform="rotate(8 116 125)"
            className={styles.paper}
          />
          <ellipse
            cx="244"
            cy="146"
            rx="15"
            ry="5"
            transform="rotate(8 244 146)"
            className={styles.paper}
          />
          <ellipse cx="116" cy="125" rx="9" ry="2.7" />
          <ellipse cx="244" cy="146" rx="9" ry="2.7" />
          <path d="m113 124 6 1m-3-3v5m125 18 6 1m-3-3v5" strokeWidth=".7" />
        </g>
        <path
          d="m181 134 7-17q16 7 32 4l3 13q-20 5-42 0Z"
          className={styles.paper}
        />
        <path
          d="m185 131 5-10q15 6 28 3l2 7q-16 4-35 0Z"
          fill={`url(#${hatchId})`}
          strokeWidth=".6"
        />
        <path d="m202 119 2-13 5 .6 1 14" className={styles.hammer} />
        <path d="m204 107 .5-4 4 .5v4" className={styles.typeSlug} />

        {/* Four stepped banks of round keys descend toward the broad apron. */}
        <path
          d="m92 166 164 26-24 60-178-29Z"
          fill={`url(#${hatchId})`}
          strokeWidth=".6"
        />
        {[0, 1, 2, 3].map((row) => (
          <g
            key={row}
            transform={`matrix(1 .15 0 1 ${96 - row * 9} ${171 + row * 16})`}
          >
            <path d="M-6 5h158" strokeWidth="1.5" />
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((column) => (
              <g key={column} transform={`translate(${column * 16.5} 0)`}>
                <path d="M-1 2v6m2-6v6" strokeWidth=".8" />
                <ellipse rx="6.3" ry="3.5" className={styles.paper} />
                <ellipse rx="4.8" ry="2.5" strokeWidth=".4" opacity=".6" />
                <text
                  y="1.5"
                  textAnchor="middle"
                  className={styles.keyLetter}
                  stroke="none"
                >
                  {keyboardRows[row]?.[column]}
                </text>
              </g>
            ))}
          </g>
        ))}
        <path d="m85 239 111 18 5-4-111-18Z" className={styles.paper} />
        <path d="m88 240 106 17" strokeWidth=".6" />
        <path d="m47 231 183 31v18L47 248Z" className={styles.paper} />
        <path
          d="m49 244 179 31v4L49 248Z"
          fill={`url(#${crosshatchId})`}
          stroke="none"
        />
        <path
          d="m48 234 25 4 7 6 115 20 7-4 26 5M87 122l-36 107m211-79-35 108"
          strokeWidth=".75"
        />
        <text
          x="55"
          y="245"
          className={styles.keyLetter}
          stroke="none"
          transform="rotate(10 55 245)"
        >
          NO.
        </text>
        <text x="217" y="272" className={styles.keyLetter} stroke="none">
          3
        </text>
      </svg>
      <div className={styles.phrases} aria-hidden="true">
        {phrases.map((phrase) => (
          <span key={phrase} className={styles.phrase}>
            {phrase}
          </span>
        ))}
      </div>
    </div>
  );
}
