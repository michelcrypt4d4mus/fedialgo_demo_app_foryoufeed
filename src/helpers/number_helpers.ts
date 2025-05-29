/*
 * Help with numbers.
 */
import { config } from "../config";
import { warnMsg } from "./log_helpers";

export const KB = 1024;
export const MB = KB * KB;


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

    if (Math.abs(score) < Math.pow(10, -1 * config.toots.scoreDigits)) return score;
    return Number(score.toPrecision(config.toots.scoreDigits));
};
