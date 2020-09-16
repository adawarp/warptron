
const StateMachine = require("./StateMachine");

test("state machine initialized", () => {
  const stateMachine = new StateMachine();
  stateMachine.registerState("init", ["init"], null,
    () => console.log("goodbye init"));
  stateMachine.run("init");
})

test("state machine transition from init to init", () => {
  const stateMachine = new StateMachine();
  stateMachine.registerState("init", ["signingIn"], null, null);
  stateMachine.registerState("signingIn",
    ["init", "signedIn", "failed"], null, null);
  stateMachine.run("init");
  stateMachine.addEventListener((s) => {
    console.log(`state changed to: ${s}`)
    if (s === "signingIn") {
        stateMachine.transition("init");
    }
  });
  stateMachine.transition("signingIn");
})

test("invalid transition", () => {
  const stateMachine = new StateMachine();
  stateMachine.registerState("a", ["b"]);
  stateMachine.registerState("b", ["a"]);
  stateMachine.run("a");
  
  expect(() => stateMachine.transition("a")).rejects
})
