/*
 * Help with numbers.
 */
import { warnMsg } from "./log_helpers";

const SCORE_DIGITS = 3;  // Number of digits to display in the alternate score


// Remove scores with a raw score of 0
export function formatScores(scores: object | number): object | number {
    if (typeof scores == "number") return formatScore(scores);

    return Object.entries(scores).reduce(
        (acc, [k, v]) => {
            if (typeof v === "object" && v.raw == 0) {
                return acc;
            }

            acc[k] = formatScores(v);
            return acc;
        },
        {} as object
    );
};


// Round a number to a given number of digits
export function formatScore(score: number): number {
    if (typeof score != "number") {
        warnMsg(`formatScore() called with non-number:`, score);
        return score;
    }

    if (Math.abs(score) < Math.pow(10, -1 * SCORE_DIGITS)) return score;
    return Number(score.toPrecision(SCORE_DIGITS));
};
