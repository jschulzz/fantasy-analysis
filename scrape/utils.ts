import { Page } from "puppeteer";
import { email, password } from "../secrets";

export const login = async (page: Page) => {
  await page.waitForSelector("iframe");

  //Gets the iframe for the login page
  const elementHandle = await page.$("div#disneyid-wrapper iframe");
  if (!elementHandle) {
    console.log("Could not find iframe");
    return;
  }
  const frame = await elementHandle.contentFrame();
  if (!frame) {
    console.log("Could not find iframe");
    return;
  }
  await frame.waitForSelector('[ng-model="vm.username"]', { visible: true });
  const usernameBox = await frame.$('[ng-model="vm.username"]');
  if (!usernameBox) {
    console.log("Could not find username box");
    return;
  }
  await usernameBox.press("Backspace");
  await usernameBox.type(email);

  await frame.waitForSelector('[ng-model="vm.password"]', { visible: true });
  const passwordBox = await frame.$('[ng-model="vm.password"]');
  if (!passwordBox) {
    console.log("Could not find password box");
    return;
  }
  await passwordBox.type(password);

  await frame.waitForSelector('[aria-label="Log In"]', { visible: true });
  const loginButton = await frame.$('[aria-label="Log In"]');
  if (!loginButton) {
    return;
  }
  await loginButton.click();

  await new Promise((res) => setTimeout(res, 4000));
};
