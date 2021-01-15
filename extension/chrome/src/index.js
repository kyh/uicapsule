import css from "bundle-text:../dist/style.css";
import $ from "jquery";
import { initalizeEventSubscription } from "./handlers/messageHandler";
// import { clickHandler, mouseEnterHanlder } from "./handlers/listeners";
// import { includeCSS, removeCSS } from "./handlers/assetLoader";

const html = `
<style>${css}</style>
<section id="popup" class="font-sans text-black z-50 w-full fixed top-0 right-0 shadow-xl new-event-form bg-white max-w-sm border-2 border-black p-5 rounded-lg border-b-6">
  <header class="flex mb-5 pl-1 items-center justify-between">
    <span class="text-2xl text-black font-extrabold">New event!</span>
  </header>
  <main class="event-name-input mb-6">
    <div class="mb-6">
      <label
        for="event-name"
        class="font-bold pl-1 block mb-1 text-black text-xl"
        >
      Event name
      </label>
      <div class="duration-400 flex bg-white border-black border-2 rounded-lg py-4 px-4 text-black text-xl focus-within:shadow-outline">
        <input
          id="event-name"
          name="event-name"
          type="text"
          placeholder="web.dev LIVE"
          class="font-medium w-full focus:outline-none"
          />
      </div>
    </div>
    </div>
    <div class="mb-6">
      <label
        for="event-date"
        class="font-bold pl-1 block mb-1 text-black text-xl"
        >
      Date
      </label>
      <div class="event-date-input duration-400 border-black flex bg-white border-2 rounded-lg py-4 px-4  text-xl focus-within:shadow-outline">
        <input
          id="event-date"
          name="event-date"
          type="date"
          class="font-medium w-full focus:outline-none"
          />
      </div>
    </div>
    <div class=" mb-8">
    <label
      for="event-time-input"
      class="font-bold pl-1 block mb-1  text-xl"
      >
    Time
    </label>
    <div class="inline-flex items-center">
      <input
        id="event-time-input"
        type="time"
        value="17:30"
        class="border-black mr-4 lowercase duration-400 w-auto bg-white text-xl border-2  rounded-lg px-4 py-4 focus:outline-none focus:shadow-outline"
        />
      <div class="inline-flex flex-col">
        <span class="text-xl font-bold">Casablanca</span>
        <span class="text-base font-normal">Africa</span>
      </div>
    </div>
  </main>
  <footer>
  <button
    class="duration-400 bg-green-400 text-xl py-4 w-full rounded-lg border-2 border-b-6 leading-7 font-extrabold border-black focus:outline-none focus:shadow-outline"
    >
  Save
  </button>
  </footer
</section>
`;

window.selectedElementPosition = null;
window.focusedElementPosition = null;
window.focusedElement = null;
window.selectedElement = null;
window.UI_CAPSULE_RULLER_ENABLED = false;

$(() => {
  const shadowHost = document.createElement("div");
  document.body.insertAdjacentElement("beforebegin", shadowHost);
  const shadowRoot = shadowHost.attachShadow({ mode: "open" });

  initalizeEventSubscription(
    () => {
      shadowRoot.innerHTML = html;
      // $("body").on("click", clickHandler);
      // $("*").on("mouseenter", mouseEnterHanlder);
      // includeCSS();
    },
    () => {
      shadowRoot.innerHTML = "";
      // $("body").off("click", clickHandler);
      // $("*").off("mouseenter", mouseEnterHanlder);
      // removeCSS();
    }
  );
});
