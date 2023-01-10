import puppeteer, { Page } from "puppeteer";
import fs from "fs";
import { load } from "cheerio";
import { login } from "./utils";
import { leagueId } from "../secrets";

const loadPage = async (date: string, pageNum: number, page: Page) => {
  const url = `https://fantasy.espn.com/football/recentactivity?leagueId=${leagueId}&endDate=${date}&page=${pageNum}&seasonId=2022&startDate=20220806&teamId=-1&transactionType=-2&activityType=2`;
  await page.goto(url, {
    timeout: 0,
  });
  await page.waitForSelector("tbody.Table__TBODY");
};

export const getTransactions = async () => {
  const browser = await puppeteer.launch({ headless: false, timeout: 0 });
  const page = await browser.newPage();
  const transactions: any[] = [];

  let url = `https://fantasy.espn.com/football/boxscore?leagueId=${leagueId}&matchupPeriodId=1&scoringPeriodId=1&seasonId=2022&teamId=4`;
  await page.goto(url, {
    waitUntil: "networkidle0",
    timeout: 0,
  });
  await login(page);
  const today = new Date();
  const dateString = `${today.getFullYear()}${(today.getMonth() + 1)
    .toString()
    .padStart(2, "0")}${today.getDate().toString().padStart(2, "0")}`;
  for (let pageNum = 1; pageNum <= 10; pageNum++) {
    console.log(pageNum, "Waiting for table...");
    try {
      await loadPage(dateString, pageNum, page);
    } catch {
      console.log("page failed to load");
      page.reload();
    }
    console.log(pageNum, "Table found...");
    const html = await page.content();
    const $ = load(html);

    $("tbody.Table__TBODY tr").each((row_idx, _row) => {
      let players: string[] = [];
      let date = "";
      $(_row)
        .find("td")
        .each((col_idx, _col) => {
          if (col_idx === 0) {
            date = $(_col).find(".date").text();
          }
          if (col_idx === 2) {
            players = $(_col)
              .find(".transaction-details")
              .map((span_idx, _span) => $(_span).text())
              .toArray();
          }

          players.forEach((player) => {
            const [matches] = [
              ...player.matchAll(/(.*) (added|dropped) (.*),/gm),
            ];
            if (!matches) {
              console.log(matches);
              return;
            }
            const [, teamName, action, playerName] = matches;
            transactions.push({
              teamName,
              action,
              playerName,
              date,
              key: `${teamName}-${action}-${playerName}-${date}`,
            });
          });
        });
    });
    const uniqueTransactions = [
      ...new Map(transactions.map((t) => [t.key, t])).values(),
    ];

    console.log(pageNum, "Writing file", uniqueTransactions.length);
    fs.writeFileSync(
      "./data/transactions.json",
      JSON.stringify(uniqueTransactions, null, 2)
    );
    await new Promise((res) => setTimeout(res, 4000));
  }
};
