import { Page } from "puppeteer";
import { email, password } from "../secrets";

export const login = async (page: Page) => {
  // //Gets the iframe for the login page
  const elementHandle = await page.$("iframe#oneid-iframe");
  if (!elementHandle) {
    console.log("Could not find iframe");
    return;
  }
  const frame = await elementHandle.contentFrame();
  if (!frame) {
    console.log("Could not find iframe");
    return;
  }
  await frame.waitForSelector("#InputIdentityFlowValue", { visible: true });
  const usernameBox = await frame.$("#InputIdentityFlowValue");
  if (!usernameBox) {
    console.log("Could not find username box");
    return;
  }
  await usernameBox.press("Backspace");
  await usernameBox.type(email);

  const continueButton = await frame.$("#BtnSubmit");
  await continueButton?.click();

  await frame.waitForSelector("#InputPassword", { visible: true });
  const passwordBox = await frame.$("#InputPassword");
  if (!passwordBox) {
    console.log("Could not find password box");
    return;
  }

  const animationTime = 3000;
  await new Promise((resolve) => setTimeout(resolve, animationTime)); // wait for animation to finish

  await passwordBox.press("Backspace");
  await passwordBox.type(password, { delay: 100 });

  const loginButton = await frame.$("#BtnSubmit");
  await loginButton?.click();

  await new Promise((res) => setTimeout(res, 4000));
};
