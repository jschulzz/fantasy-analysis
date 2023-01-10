import puppeteer from "puppeteer";
import { load } from "cheerio";
import fs from "fs";
import { login } from "./utils";
import { leagueId } from "../secrets";

export const getBoxScores = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  const url = `https://fantasy.espn.com/football/boxscore?leagueId=${leagueId}&matchupPeriodId=1&scoringPeriodId=1&seasonId=2022&teamId=4`;
  await page.goto(url, {
    waitUntil: "networkidle0",
    timeout: 0,
  });
  await login(page);
  const matches: any[] = [];
  for (let week = 17; week >= 1; week--) {
    const url = `https://fantasy.espn.com/football/boxscore?leagueId=${leagueId}&matchupPeriodId=${week}&scoringPeriodId=${week}&seasonId=2022&teamId=4`;
    await page.goto(url, {
      timeout: 0,
    });
    await page.waitForSelector(
      "div.Thumbnails__Inner .Thumbnails__Item__Container",
      { timeout: 0 }
    );
    for (let matchup = 0; matchup < 6; matchup++) {
      const children = await page.$$(
        "div.Thumbnails__Inner .Thumbnails__Item__Container"
      );
      await children[matchup].click();
      await new Promise((res) => setTimeout(res, 4000));
      const html = await page.content();
      const $ = load(html);

      const competitors: any[] = [];
      $(".matchupTable").each((table_idx, _table) => {
        const [name] = $(_table)
          .find($("span.team-name"))
          .text()
          .trim()
          .split("Box Score");
        console.log(name);
        const players: any[] = [];
        $(_table)
          .find("tbody tr")
          .each((row_idx, _row) => {
            let player_name = "";
            let started = row_idx < 9;
            let player_position = "";
            let roster_position = "";
            let player_projected = 0;
            let player_actual = 0;
            if (row_idx === 9 || row_idx === 17) {
              return;
            }
            $(_row)
              .find("td")
              .each((col_idx, _col) => {
                if (col_idx === 0) {
                  roster_position = $(_col).text();
                }
                if (col_idx === 1) {
                  player_name = $(_col).find("a.clr-link").text();
                  player_position = $(_col)
                    .find("span.playerinfo__playerpos")
                    .text();
                }
                if (col_idx === 4) {
                  player_projected = Number($(_col).text());
                }
                if (col_idx === 5) {
                  player_actual = Number($(_col).text());
                }
              });
            players.push({
              player_actual,
              player_name,
              player_position,
              player_projected,
              roster_position,
              started,
            });
          });
        const isHome = table_idx === 1;
        const competitor = {
          name,
          players,
          isHome,
        };
        competitors.push(competitor);
        console.log(matchup, name, players);
      });
      matches.push({ week, competitors });
    }
    fs.writeFileSync("./data/matches.json", JSON.stringify(matches, null, 2));
  }
};
