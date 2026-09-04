export const cases = [
  { id:"TXN100070", customer:"C1020", risk:45707.43, probability:56.4, action:"Payment Link", status:"recovered", recovered:45707.43, reason:"network_error", time:"5h ago" },
  { id:"TXN100069", customer:"C1019", risk:4105.93, probability:94.6, action:"Reminder", status:"recovered", recovered:4105.93, reason:"issuer_decline", time:"5h ago" },
  { id:"TXN100068", customer:"C1018", risk:6619.92, probability:56.0, action:"Payment Link", status:"recovered", recovered:6619.92, reason:"network_error", time:"5h ago" },
  { id:"TXN100067", customer:"C1017", risk:43676.12, probability:49.5, action:"Payment Link", status:"failed", recovered:0, reason:"expired_card", time:"5h ago" },
  { id:"TXN100066", customer:"C1016", risk:17200.68, probability:68.0, action:"Reminder", status:"recovered", recovered:17200.68, reason:"incorrect_otp", time:"5h ago" },
  { id:"TXN100065", customer:"C1015", risk:657.48, probability:89.2, action:"Escalate", status:"escalated", recovered:0, reason:"issuer_decline", time:"5h ago" },
  { id:"TXN100064", customer:"C1014", risk:2523.70, probability:29.3, action:"Payment Link", status:"stopped", recovered:0, reason:"insufficient_funds", time:"5h ago" },
  { id:"TXN100063", customer:"C1013", risk:6588.29, probability:15.0, action:"Reminder", status:"stopped", recovered:0, reason:"expired_card", time:"5h ago" },
  { id:"TXN100062", customer:"C1012", risk:5582.83, probability:98.0, action:"Reminder", status:"recovered", recovered:5582.83, reason:"network_error", time:"5h ago" },
  { id:"TXN100061", customer:"C1011", risk:1418.30, probability:87.9, action:"Escalate", status:"escalated", recovered:0, reason:"bank_timeout", time:"5h ago" },
  { id:"TXN100060", customer:"C1010", risk:1630.54, probability:96.1, action:"Payment Link", status:"recovered", recovered:1630.54, reason:"network_error", time:"5h ago" },
  { id:"TXN100059", customer:"C1009", risk:24218.91, probability:36.3, action:"Payment Link", status:"failed", recovered:0, reason:"expired_card", time:"5h ago" }
];

export const customers = [
  ["C1010",49,38,6,54000,916185.83,20.2,"active"],
  ["C1033",65,21,2,54000,660178.75,11.8,"cancelled"],
  ["C1043",53,40,6,24000,586027.76,21.1,"cancelled"],
  ["C1038",56,16,0,54000,537409.42,8.7,"cancelled"],
  ["C1027",15,19,4,54000,534897.05,13.1,"active"],
  ["C1009",58,34,1,24000,457106.53,67.0,"paused"],
  ["C1012",28,22,3,24000,345670.20,20.1,"paused"],
  ["C1048",16,25,1,24000,322284.98,13.3,"active"],
  ["C1015",55,22,5,24000,304921.77,11.6,"none"],
  ["C1005",37,8,2,54000,212554.91,4.7,"active"],
  ["C1035",3,17,6,24000,181840.51,9.8,"none"],
  ["C1029",69,21,3,12500,143338.20,11.2,"paused"],
  ["C1032",83,36,6,7800,137847.75,18.9,"active"],
  ["C1041",10,34,2,7800,133227.35,17.6,"active"],
  ["C1006",19,38,4,5200,132379.77,20.2,"active"]
];

export const revenueTrend = [
  { day:"Mon", risk:42, recovered:25 },
  { day:"Tue", risk:51, recovered:34 },
  { day:"Wed", risk:48, recovered:31 },
  { day:"Thu", risk:67, recovered:44 },
  { day:"Fri", risk:58, recovered:47 },
  { day:"Sat", risk:73, recovered:52 },
  { day:"Sun", risk:61, recovered:49 }
];

export const actions = [
  { name:"Payment Link", value:42 },
  { name:"Escalate", value:31 },
  { name:"Reminder", value:18 },
  { name:"Retry", value:9 }
];

export const failureMix = [
  { name:"Network", value:31 },
  { name:"Issuer", value:24 },
  { name:"Timeout", value:17 },
  { name:"OTP", value:14 },
  { name:"Card", value:9 },
  { name:"Funds", value:5 }
];
