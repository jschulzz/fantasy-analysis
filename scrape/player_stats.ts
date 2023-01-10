import axios from "axios";
import fs from "fs";

import { ESPNCookie, leagueId } from "../secrets";

export const getPlayerData = async () => {
  const playerMap = new Map();
  for (let i = 1; i <= 16; i++) {
    const data = await axios.get(
      `https://fantasy.espn.com/apis/v3/games/ffl/seasons/2022/segments/0/leagues/${leagueId}?scoringPeriodId=${i}&view=kona_player_info`,
      {
        headers: {
          accept: "application/json",
          "accept-language": "en-US,en;q=0.9",
          "if-none-match": 'W/"011ce8adae77f8cf272c13a1020d7ef6e"',
          "sec-ch-ua":
            '"Not?A_Brand";v="8", "Chromium";v="108", "Google Chrome";v="108"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"macOS"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "x-fantasy-filter": `{"players":{"filterSlotIds":{"value":[0,2,23,4,6,17,16]},"filterStatsForCurrentSeasonScoringPeriodId":{"value":[${i}]},"sortPercOwned":{"sortPriority":3,"sortAsc":false},"limit":5000,"offset":0,"sortAppliedStatTotalForScoringPeriodId":{"sortAsc":false,"sortPriority":1,"value":${i}},"filterRanksForScoringPeriodIds":{"value":[${i}]},"filterRanksForRankTypes":{"value":["PPR"]},"filterRanksForSlotIds":{"value":[0,2,4,6,17,16]}}}`,
          "x-fantasy-platform":
            "kona-PROD-d32c2662dd9c144ffb908e0045dbbb9c37314398",
          "x-fantasy-source": "kona",
          cookie: ESPNCookie,
          Referer:
            `https://fantasy.espn.com/football/leaders?leagueId=${leagueId}&statSplit=singleScoringPeriod&scoringPeriodId=15`,
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
      }
    );
    data.data.players.forEach((player: any) => {
      const name = player.player.fullName;

      const properStats = player.player.stats.find(
        (x: any) => x.statSourceId === 0
      );
      if (!properStats) {
        return;
      }
      const points = properStats.appliedTotal;
      let obj = playerMap.get(name);
      if (!obj) {
        obj = {};
      }
      obj[i] = Number(points).toFixed(1);
      playerMap.set(name, obj);
    });
  }
  const csv: string[] = [];
  const obj: { [name: string]: any[] } = {};
  [...playerMap.keys()].forEach((playerName: string) => {
    let weeks: any[] = [];
    for (let i = 1; i <= 16; i++) {
      const pts = playerMap.get(playerName)[i];
      if (pts !== undefined) {
        weeks.push(pts);
      } else {
        weeks.push("BYE");
      }
    }
    csv.push([playerName, ...weeks].join(","));
    obj[playerName] = weeks.map((score, idx) => {
      return { week: idx + 1, score };
    });
  });
  fs.writeFileSync("./data/player_stats.csv", csv.join("\n"));
  fs.writeFileSync("./data/player_stats.json", JSON.stringify(obj, null, 2));
};
