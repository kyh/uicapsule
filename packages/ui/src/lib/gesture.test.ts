import { describe, expect, it } from "vitest";

import {
  clamp,
  createHysteresis,
  createVelocityTracker,
  nearestDetent,
  project,
  rubberband,
  snapToStep,
} from "./gesture";

describe("clamp", () => {
  it("bounds values", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });
});

describe("project", () => {
  it("adds weighted velocity to offset", () => {
    expect(project(100, 500)).toBe(190);
    expect(project(-40, -1000, 0.2)).toBe(-240);
    expect(project(60, 0)).toBe(60);
  });
});

describe("nearestDetent", () => {
  it("picks the closest stop", () => {
    expect(nearestDetent(47, [0, 50, 100])).toBe(50);
    expect(nearestDetent(20, [0, 50, 100])).toBe(0);
    expect(nearestDetent(-30, [0, 50, 100])).toBe(0);
  });

  it("handles an empty list", () => {
    expect(nearestDetent(12, [])).toBe(0);
  });
});

describe("snapToStep", () => {
  it("snaps to a uniform grid", () => {
    expect(snapToStep(47, 38)).toBe(38);
    expect(snapToStep(58, 38)).toBe(76);
    expect(snapToStep(-19.1, 38)).toBe(-38);
  });

  it("respects an origin offset", () => {
    expect(snapToStep(21, 10, 4)).toBe(24);
  });
});

describe("rubberband", () => {
  it("damps monotonically and stays under the asymptote", () => {
    const d1 = rubberband(50, 400);
    const d2 = rubberband(200, 400);
    const d3 = rubberband(2000, 400);
    expect(d1).toBeLessThan(50);
    expect(d2).toBeGreaterThan(d1);
    expect(d3).toBeGreaterThan(d2);
    expect(d3).toBeLessThan(400);
  });

  it("is zero at the boundary", () => {
    expect(rubberband(0, 400)).toBe(0);
  });

  it("mirrors for negative distances", () => {
    expect(rubberband(-120, 400)).toBeCloseTo(-rubberband(120, 400));
  });
});

describe("createHysteresis", () => {
  it("engages above enter and releases below exit only", () => {
    const gate = createHysteresis({ enter: 140, exit: 90 });
    expect(gate.update(100)).toBe(false); // below enter
    expect(gate.update(150)).toBe(true); // engaged
    expect(gate.update(120)).toBe(true); // between exit and enter → holds
    expect(gate.update(80)).toBe(false); // below exit → releases
    gate.update(150);
    gate.reset();
    expect(gate.engaged).toBe(false);
  });
});

describe("createVelocityTracker", () => {
  it("computes px/s from samples", () => {
    const tracker = createVelocityTracker(100);
    tracker.push(0, 1000);
    tracker.push(10, 1050);
    tracker.push(20, 1100);
    expect(tracker.velocity(1100)).toBeCloseTo(200);
  });

  it("ignores samples outside the window", () => {
    const tracker = createVelocityTracker(100);
    tracker.push(0, 0);
    tracker.push(1000, 500);
    tracker.push(1010, 550);
    expect(tracker.velocity(560)).toBeCloseTo(200, 0);
  });

  it("returns 0 with insufficient data", () => {
    const tracker = createVelocityTracker();
    expect(tracker.velocity()).toBe(0);
    tracker.push(50, 10);
    expect(tracker.velocity(20)).toBe(0);
  });
});
