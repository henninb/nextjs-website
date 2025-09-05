// import {NextResponse} from 'next/server';
//import { perimeterx } from "perimeterx-nextjs";

export const runtime = "edge";

const pxConfig = {
  px_app_id: "PXjJ0cYtn9",
  px_cookie_secret: "sec",
  px_auth_token: "tok",
  px_module_mode: "monitor",
  px_bypass_monitor_header: "x-px-block",
};

//export default perimeterx(pxConfig);

// export default async function handler(req, res) {
//   try {
//     const human = await perimeterx(pxConfig);
//     // const res = await human();

//     // console.log("result: " + res);
//     res.status(200).json({ success: true });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// }
