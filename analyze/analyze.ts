import fs from "fs";
import { Matchup, Player, Transaction } from "../types";

export const avg = (arr: number[]) => {
  return arr.reduce((prev, curr) => prev + curr, 0) / arr.length;
};

export const readData = () => {
  const matches: Matchup[] = JSON.parse(
    fs.readFileSync("./data/matches.json").toString()
  );
  return matches;
};

export const tryMatch = (week: number, t1: string, t2: string) => {
  const matches = readData();
  const weekMatches = matches.filter((m) => m.week === week);

  const match1 = weekMatches.find((m) =>
    m.competitors.map((c) => c.name).includes(t1)
  ) as Matchup;

  const l1 = match1.competitors.find((c) => c.name === t1)?.players as Player[];
  const match2 = weekMatches.find((m) =>
    m.competitors.map((c) => c.name).includes(t2)
  ) as Matchup;
  const l2 = match2.competitors.find((c) => c.name === t2)?.players as Player[];

  const optimal_l1_score = scoreLineup(findOptimalLineup(l1));
  const optimal_l2_score = scoreLineup(findOptimalLineup(l2));
  console.log(`${t1}: ${optimal_l1_score}\n${t2}: ${optimal_l2_score}`);
};

const scoreLineup = (lineup: Player[], useProjection = false) => {
  const optimal_score = lineup.reduce(
    (prev, curr) =>
      prev + (useProjection ? curr.player_projected : curr.player_actual),
    0
  );
  return optimal_score;
};

const originalLineup = (roster: Player[]) => {
  return roster.filter((p) => p.started);
};

const findOptimalLineup = (roster: Player[], byProjection = false) => {
  const lineupMakeup = [
    "QB",
    "RB",
    "RB",
    "WR",
    "WR",
    "TE",
    "FLEX",
    "K",
    "D/ST",
  ];
  const options = new Map([
    ["QB", ["QB"]],
    ["RB", ["RB"]],
    ["WR", ["WR"]],
    ["TE", ["TE"]],
    ["FLEX", ["RB", "WR", "TE"]],
    ["K", ["K"]],
    ["D/ST", ["D/ST"]],
  ]);
  const optimal_lineup: Player[] = [];
  lineupMakeup.forEach((position) => {
    const player_options = roster.filter(
      (p) =>
        options.get(position)?.includes(p.player_position) &&
        !optimal_lineup.includes(p)
    );
    const sortField = byProjection ? "player_projected" : "player_actual";
    const [best_option] = player_options.sort((a, b) =>
      a[sortField] < b[sortField] ? 1 : -1
    );
    optimal_lineup.push(best_option);
  });
  return optimal_lineup;
};

export const playingOptimally = () => {
  const matches = readData();
  const changes = new Map();
  const wins = new Map();
  const totals = new Map();
  let bestScore = 0;
  let bestTeam = "";
  matches.forEach((match: any) => {
    if (match.week > 14) {
      return;
    }
    const competitors = match.competitors;
    if (!competitors || !competitors.length) {
      return;
    }
    const actual_score_1 = scoreLineup(originalLineup(competitors[0].players));
    const actual_score_2 = scoreLineup(originalLineup(competitors[1].players));

    const optimal_score_1 = scoreLineup(
      findOptimalLineup(competitors[0].players)
    );
    const optimal_score_2 = scoreLineup(
      findOptimalLineup(competitors[1].players)
    );

    if (!totals.has(competitors[0].name)) {
      totals.set(competitors[0].name, 0);
    }
    if (!totals.has(competitors[1].name)) {
      totals.set(competitors[1].name, 0);
    }
    totals.set(
      competitors[0].name,
      totals.get(competitors[0].name) + optimal_score_1
    );
    totals.set(
      competitors[1].name,
      totals.get(competitors[1].name) + optimal_score_2
    );
    if (optimal_score_1 > bestScore) {
      bestScore = optimal_score_1;
      bestTeam = `${match.week} - ${competitors[0].name}`;
    }
    if (optimal_score_2 > bestScore) {
      bestScore = optimal_score_2;
      bestTeam = `${match.week} - ${competitors[1].name}`;
    }
    const actual_winner =
      actual_score_1 - actual_score_2 > 0
        ? competitors[0].name
        : competitors[1].name;
    const optimal_winner =
      optimal_score_1 - optimal_score_2 > 0
        ? competitors[0].name
        : competitors[1].name;

    if (!wins.has(optimal_winner)) {
      wins.set(optimal_winner, 0);
    }
    wins.set(optimal_winner, wins.get(optimal_winner) + 1);
    if (actual_winner !== optimal_winner) {
      if (!changes.has(optimal_winner)) {
        changes.set(optimal_winner, 0);
      }
      if (!changes.has(actual_winner)) {
        changes.set(actual_winner, 0);
      }
      changes.set(optimal_winner, changes.get(optimal_winner) + 1);
      changes.set(actual_winner, changes.get(actual_winner) - 1);
      console.log(
        `Flipped Result of ${competitors[0].name} v ${competitors[1].name} in favor of ${optimal_winner}`
      );
    }
  });
  console.log(bestScore, bestTeam);
  console.log(changes, wins, totals);
};

export const closeToOptimal = (byOpponent = false, useProjection = false) => {
  const matches = readData();
  const optimalities: { [key: string]: number[] } = {};
  const scalefactor = 1000;
  matches.forEach((match) => {
    const competitors = match.competitors;
    if (!competitors || !competitors.length) {
      return;
    }
    if (!optimalities[competitors[0].name]) {
      optimalities[competitors[0].name] = [];
    }
    if (!optimalities[competitors[1].name]) {
      optimalities[competitors[1].name] = [];
    }
    const actual_score_1 = scoreLineup(
      originalLineup(competitors[0].players),
      useProjection
    );
    const optimal_score_1 = scoreLineup(
      findOptimalLineup(competitors[0].players, useProjection),
      useProjection
    );
    optimalities[competitors[+byOpponent].name].push(
      Math.round((scalefactor * actual_score_1) / optimal_score_1) / scalefactor
    );
    if (actual_score_1 / optimal_score_1 < 0.7) {
      console.log(
        competitors[+byOpponent].name,
        match.week,
        actual_score_1 / optimal_score_1
      );
    }
    const actual_score_2 = scoreLineup(
      originalLineup(competitors[1].players),
      useProjection
    );
    const optimal_score_2 = scoreLineup(
      findOptimalLineup(competitors[1].players, useProjection),
      useProjection
    );
    if (actual_score_2 / optimal_score_2 < 0.7) {
      console.log(
        competitors[+!byOpponent].name,
        match.week,
        actual_score_2 / optimal_score_2
      );
    }
    optimalities[competitors[+!byOpponent].name].push(
      Math.round((scalefactor * actual_score_2) / optimal_score_2) / scalefactor
    );
  });

  Object.entries(optimalities).forEach((value) => {
    const [team, lineupScores] = value;
    const originalLineupScores = [...lineupScores];
    const median = lineupScores.sort()[Math.floor(lineupScores.length / 2)];
    const avg =
      lineupScores.reduce((prev, curr) => prev + curr, 0) /
      Object.values(lineupScores).length;
    console.log(team, { median, avg, lineupScores: originalLineupScores });
  });
};

export const underperforming = () => {
  const matches = readData();
  const results: { [key: string]: number[] } = {};
  matches.forEach((match) => {
    if (!match.competitors || !match.competitors.length) {
      return;
    }
    const competitor1 = match.competitors[0];
    const competitor2 = match.competitors[1];
    const name1 = competitor1.name;
    if (!results[name1]) {
      results[name1] = [];
    }
    const name2 = competitor2.name;
    if (!results[name2]) {
      results[name2] = [];
    }
    const projectedTotal1 = scoreLineup(
      originalLineup(competitor1.players),
      true
    );
    const actualTotal1 = scoreLineup(
      originalLineup(competitor1.players),
      false
    );
    const projectedTotal2 = scoreLineup(
      originalLineup(competitor2.players),
      true
    );
    const actualTotal2 = scoreLineup(
      originalLineup(competitor2.players),
      false
    );
    results[name2].push(Number((actualTotal1 - projectedTotal1).toFixed(2)));
    results[name1].push(Number((actualTotal2 - projectedTotal2).toFixed(2)));
  });
  Object.entries(results).forEach((value) => {
    const avg =
      value[1].reduce((prev, curr) => prev + curr, 0) / value[1].length;
    console.log(value[0], avg);
  });
};

export const deepestLineup = (position = "QB") => {
  const averageByPosition = (roster: Player[]) => {
    const positions = [...new Set(roster.map((r) => r.player_position))];
    const total: any[] = [];
    positions.forEach((position) => {
      const matchingPlayers = roster.filter(
        (r) => r.player_position === position
      );
      const sum = matchingPlayers.reduce(
        (prev, curr) => prev + curr.player_actual,
        0
      );
      total.push({ position, avg: sum / matchingPlayers.length });
    });
    return total;
  };

  const sums = new Map();
  const averages = new Map();

  const matches = readData();
  matches.forEach((match) => {
    match.competitors.forEach((competitor) => {
      if (!sums.has(competitor.name)) {
        sums.set(competitor.name, {
          QB: [],
          RB: [],
          WR: [],
          TE: [],
          "D/ST": [],
          K: [],
          "": [],
        });
      }
      const avgByPosition = averageByPosition(competitor.players);
      const score = avgByPosition.find((x: any) => x.position === position).avg;
      score > 10 &&
        competitor.players.filter((x) => x.player_position === position)
          .length > 1 &&
        console.log(competitor.name, match.week, score);
      const currentRecord = sums.get(competitor.name);
      avgByPosition.forEach((position) => {
        currentRecord[position.position].push(position.avg);
      });
    });
  });
  [...sums.keys()].forEach((team) => {
    const values = sums.get(team);
    const total: any = {};
    Object.keys(values).forEach((position) => {
      total[position] = avg(values[position]);
    });
    averages.set(team, total);
  });
  [...averages.keys()].forEach((key) => {
    console.log(
      `${key},${averages.get(key)["QB"]},${averages.get(key)["RB"]},${
        averages.get(key)["WR"]
      },${averages.get(key)["TE"]},${averages.get(key)["D/ST"]},${
        averages.get(key)["K"]
      }`
    );
  });
  // console.log(averages);
};

export const findBestLineup = () => {
  const matches = readData();

  const weeks: Set<number> = new Set(matches.map((match) => match.week));

  weeks.forEach((week) => {
    const weeklyMatches = matches.filter((match) => match.week === week);
    const allPlayers = weeklyMatches
      .flatMap((match) =>
        match.competitors.map((competitor) => competitor.players)
      )
      .flat();
    const optimalLineup = findOptimalLineup(allPlayers);
    console.log(
      week,
      scoreLineup(optimalLineup),
      optimalLineup.filter((l) => !l.started).length
    );
  });
};

export const findWorstDrop = () => {
  const dateToWeek = (date: Date) => {
    const weeks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
    const dates = [
      new Date("9 / 7 / 23"),
      new Date("9 / 14 / 23"),
      new Date("9 / 21 / 23"),
      new Date("9 / 29 / 23"),
      new Date("10 / 5 / 23"),
      new Date("10 / 12 / 23"),
      new Date("10 / 19 / 23"),
      new Date("10 / 26 / 23"),
      new Date("11 / 2 / 23"),
      new Date("11 / 9 / 23"),
      new Date("11 / 16 / 23"),
      new Date("11 / 23 / 23"),
      new Date("11 / 30 / 23"),
      new Date("12 / 7 / 23"),
      new Date("12 / 14 / 23"),
      new Date("12 / 21 / 23"),
    ];
    for (let i = 0; i < dates.length; i++) {
      if (dates[i] > date) {
        return weeks[i - 1];
      }
    }
    return weeks.at(0) as number;
  };
  const transactions: Transaction[] = JSON.parse(
    fs.readFileSync("./data/transactions.json").toString()
  );
  const playerStats: {
    [playerName: string]: { week: number; score: string }[];
  } = JSON.parse(fs.readFileSync("./data/player_stats.json").toString());
  transactions
    .filter((x) => x.action === "added")
    .forEach((transaction) => {
      const { playerName, date, teamName } = transaction;
      const dropWeek = dateToWeek(new Date(date + " 2023"));
      const ptsBefore = avg(
        playerStats[playerName]
          .filter((p) => p.week < dropWeek)
          .map((x) => x.score)
          .filter((x) => x !== "BYE")
          .map((x) => Number(x))
      );
      const ptsAfter = avg(
        playerStats[playerName]
          .filter((p) => p.week > dropWeek)
          .map((x) => x.score)
          .filter((x) => x !== "BYE")
          .map((x) => Number(x))
      );
      console.log(`${playerName},${teamName},${ptsBefore},${ptsAfter}`);
    });
};

export const opponentDifferentials = () => {
  const matches = readData();

  const teamTotals = new Map<string, Map<string, number[]>>();

  matches.forEach((match) => {
    if (match.competitors.length < 2) {
      return;
    }
    if (!teamTotals.has(match.competitors[0].name)) {
      teamTotals.set(match.competitors[0].name, new Map());
    }
    if (!teamTotals.has(match.competitors[1].name)) {
      teamTotals.set(match.competitors[1].name, new Map());
    }
    const team1Total = teamTotals.get(match.competitors[0].name) as Map<
      string,
      number[]
    >;
    const team2Total = teamTotals.get(match.competitors[1].name) as Map<
      string,
      number[]
    >;
    if (!team1Total.has(match.competitors[1].name)) {
      team1Total.set(match.competitors[1].name, []);
    }
    if (!team2Total.has(match.competitors[0].name)) {
      team2Total.set(match.competitors[0].name, []);
    }
    const score1 = scoreLineup(originalLineup(match.competitors[0].players));
    const score2 = scoreLineup(originalLineup(match.competitors[1].players));
    const scores1 = team1Total.get(match.competitors[1].name) as number[];
    const scores2 = team2Total.get(match.competitors[0].name) as number[];
    scores1.push(score1);
    scores2.push(score2);
    // console.log(score1, score2)
    team1Total.set(match.competitors[1].name, scores1);
    team2Total.set(match.competitors[0].name, scores2);
    teamTotals.set(match.competitors[0].name, team1Total);
    teamTotals.set(match.competitors[1].name, team2Total);
  });
  //   console.log(teamTotals);
  const diffs = new Map();
  const averages = new Map();
  const averageDiffs = new Map();
  [...teamTotals.entries()].forEach((value) => {
    const [team1, opponents] = value;
    const scores = [...opponents.values()].flat();
    averages.set(team1, avg(scores));
  });
  console.log("Averages", averages);
  teamTotals.forEach((opponents, team1) => {
    opponents.forEach((scores, opponent) => {
      const teamAvg = averages.get(team1);
      scores.forEach((score) => {
        console.log(
          `${team1} vs ${opponent} scored ${score - teamAvg} from their avg`
        );
        const pastScores = diffs.get(opponent) || [];
        pastScores.push(score - teamAvg);
        diffs.set(opponent, pastScores);
      });
    });
  });
  console.log("Opponent Diffs", diffs);
  [...diffs.entries()].forEach((value) => {
    const [team1, opponents] = value;
    const scores = [...opponents.values()].flat();
    averageDiffs.set(team1, avg(scores));
  });
  console.log("Average Diff", averageDiffs);
};
