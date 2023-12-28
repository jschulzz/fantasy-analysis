import {
  closeToOptimal,
  deepestLineup,
  findBestLineup,
  findWorstDrop,
  opponentDifferentials,
  playingOptimally,
  underperforming,
} from "./analyze/analyze";
import { getBoxScores } from "./scrape/box_scores";
import { getPlayerData } from "./scrape/player_stats";
import { getTransactions } from "./scrape/transactions";

opponentDifferentials();
