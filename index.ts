import {
  closeToOptimal,
  deepestLineup,
  findWorstDrop,
  opponentDifferentials,
} from "./analyze/analyze";
import { getBoxScores } from "./scrape/box_scores";
import { getPlayerData } from "./scrape/player_stats";
import { getTransactions } from "./scrape/transactions";

closeToOptimal();
