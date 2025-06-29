"use strict";
class Vehicle {
  v_max; // maximum line speed (m/s)
  a_acc; // acceleration (m/s^2)
  a_dcc; // deceleration (m/s^2)
  s_acc; // distance to accelerate to v_max (m)
  s_dcc; // distance to stop from v_max (m)
  t_acc; // time to accelerate to v_max (s)
  t_dcc; // time to stop from v_max (s)
  constructor(v_max, a_acc, a_dcc) {
    this.v_max = v_max;
    this.a_acc = a_acc;
    this.a_dcc = a_dcc;
    this.s_acc = this.v_max ** 2 / (2 * this.a_acc);
    this.s_dcc = this.v_max ** 2 / (2 * this.a_dcc);
    this.t_acc = this.v_max / this.a_acc;
    this.t_dcc = this.v_max / this.a_dcc;
  }
}
class Operations {
  t_hw; // headway (s)
  t_dw; // dwell time (s)
  constructor(t_hw, t_dw) {
    this.t_hw = t_hw;
    this.t_dw = t_dw;
  }
}
class Journey {
  s_j; // journey distance (m)
  v_walk; // walking speed (m/s)
  constructor(s_j, v_walk) {
    this.s_j = s_j;
    this.v_walk = v_walk;
  }
}
class Coverage_Paradox_Simulation {
  jny;
  veh;
  ops;
  sim_results;
  constructor(params) {
    this.jny = params.jny;
    this.veh = params.veh;
    this.ops = params.ops;
    this.sim_results = [];
  }
  runSimulation() {
    const n_stn_max = Math.ceil(
      this.jny.s_j / (this.veh.s_acc + this.veh.s_dcc) + 0.5
    );
    this.sim_results = [];
    for (let n_stn = 2; n_stn < n_stn_max; n_stn++) {
      let ind_result = this.runIndSimulation(n_stn);
      this.sim_results.push(ind_result);
    }
    return this.sim_results;
  }
  runIndSimulation(n_stn) {
    const s_is = this.jny.s_j / (n_stn - 0.5); // distance between stations
    const s_vmax = s_is - this.veh.s_acc - this.veh.s_dcc; // distance at v_max between stations
    const t_vmax = s_vmax / this.veh.v_max; // time at v_max between stations
    const t_is = t_vmax + this.veh.t_acc + this.veh.t_dcc; // time to travel between stations
    const t_vehicle = t_is * (n_stn - 1) + this.ops.t_dw * (n_stn - 2); // vehicle time
    const t_access = s_is / 4 / this.jny.v_walk; // access time
    const t_wait = this.ops.t_hw / 2; // wait time
    const t_dtd = t_vehicle + 2 * t_access + t_wait; // door to door journey time
    const simulationResult = {
      n_stn: n_stn,
      s_is: s_is,
      t_vehicle: t_vehicle,
      t_access: t_access,
      t_wait: t_wait,
      t_dtd: t_dtd,
    };
    return simulationResult;
  }
  getOptimumResult() {
    let optimum_result = this.sim_results[0];
    for (var test_result of this.sim_results) {
      if (test_result.t_dtd <= optimum_result.t_dtd) {
        optimum_result = test_result;
      }
    }
    return optimum_result;
  }
}
function setFormValues(formVals) {
  for (const [key, value] of Object.entries(formVals)) {
    const selector = key + "-input";
    const inputElement = document.getElementById(selector);
    inputElement.value = value;
  }
}
function getFormValues() {
  return {
    s_j: parseFloat(document.getElementById("s_j-input").value),
    tphpd: parseFloat(document.getElementById("tphpd-input").value),
    v_max: parseFloat(document.getElementById("v_max-input").value),
    a_acc: parseFloat(document.getElementById("a_acc-input").value),
    a_dcc: parseFloat(document.getElementById("a_dcc-input").value),
    t_dw: parseFloat(document.getElementById("t_dw-input").value),
    v_walk: parseFloat(document.getElementById("v_walk-input").value),
  };
}
function convertUnit(baseValue, baseUnit, outUnit) {
  let outValue = 0;
  switch (baseUnit + ":" + outUnit) {
    case "m/s:km/h": {
      outValue = baseValue * 3.6;
      break;
    }
    case "km/h:m/s": {
      outValue = baseValue / 3.6;
      break;
    }
    case "km:m": {
      outValue = baseValue * 1000;
      break;
    }
    case "m:km": {
      outValue = baseValue / 1000;
      break;
    }
    case "s:minute": {
      outValue = baseValue / 60;
      break;
    }
    case "minute:s": {
      outValue = baseValue * 60;
      break;
    }
    case "tphpd:s": {
      outValue = 3600 / baseValue;
      break;
    }
    case "s:tphpd": {
      outValue = 3600 / baseValue;
      break;
    }
    default: {
      console.warn(`unsupported unit conversation ${baseUnit} to ${outUnit}`);
      break;
    }
  }
  return outValue;
}
function buildSimulationParams(formValues) {
  const veh = new Vehicle(
    convertUnit(formValues.v_max, "km/h", "m/s"),
    formValues.a_acc,
    formValues.a_dcc
  );
  const jny = new Journey(
    convertUnit(formValues.s_j, "km", "m"),
    convertUnit(formValues.v_walk, "km/h", "m/s")
  );
  const ops = new Operations(
    convertUnit(formValues.tphpd, "tphpd", "s"),
    convertUnit(formValues.t_dw, "minute", "s")
  );
  return {
    veh: veh,
    jny: jny,
    ops: ops,
  };
}
const DEFAULT_VALUES = {
  s_j: 13.7, // journey distance (km)
  tphpd: 30, // trains per hour per direction.
  v_max: 90, // maximum line speed (km/h)
  a_acc: 1.3, // mean acceleration (m/s/s)
  a_dcc: 1.2, // mean deceleration (m/s/s)
  t_dw: 1.5, // dwell time (mins)
  v_walk: 4.7, // average walking pace (km/h)
};
const FORM_ID = "notebook-parameter-form";
function updateCharts(event) {
  event.preventDefault();
  const formValues = getFormValues();
  const simParams = buildSimulationParams(formValues);
  const sim = new Coverage_Paradox_Simulation(simParams);
  const simResults = sim.runSimulation();
  console.log(simResults);
  buildDTDChart(simResults);
  buildPercVehChart(simResults);
}
window.addEventListener("load", (event) => {
  setFormValues(DEFAULT_VALUES);
  const form = document.getElementById(FORM_ID);
  if (form) form.addEventListener("submit", updateCharts);
});
function buildPercVehChart(sim_result) {
  const percVehChartData = {
    labels: sim_result.map((row) => row.s_is),
    datasets: [
      {
        label: "Percentage Time in Vehicle",
        data: sim_result.map((row) => (row.t_vehicle / row.t_dtd) * 100),
      },
    ],
  };
  if (percVehChart != undefined) {
    percVehChart.data = percVehChartData;
    percVehChart.update();
  } else {
    percVehChart = new Chart("perc-veh-chart", {
      type: "line",
      data: percVehChartData,
      options: percVehChartOptions,
    });
  }
}
function buildDTDChart(sim_result) {
  // if there is an existing chart then destroy it
  const dtdChartData = {
    labels: sim_result.map((row) => row.n_stn),
    datasets: [
      {
        label: "Door-to-Door Journey Time (s)",
        data: sim_result.map((row) => row.t_dtd),
      },
      {
        label: "Wait Time (s)",
        data: sim_result.map((row) => row.t_wait),
      },
      {
        label: "Vehicle Time (s)",
        data: sim_result.map((row) => row.t_vehicle),
      },
      {
        label: "Access Time (s)",
        data: sim_result.map((row) => row.t_access),
      },
    ],
  };
  if (dtdChart != undefined) {
    dtdChart.data = dtdChartData;
    dtdChart.update();
  } else {
    dtdChart = new Chart("dtd-chart", {
      type: "line",
      data: dtdChartData,
      options: dtdChartOptions,
    });
  }
}
let dtdChart;
let percVehChart;
const percVehChartOptions = {
  scales: {
    x: {
      title: {
        display: true,
        text: "Interstation Distance (m)",
      },
      type: "linear",
    },
    y: {
      title: {
        display: true,
        text: "Percentage of Journey Time spent in Vehicle",
      },
    },
  },
  plugins: {
    title: {
      display: true,
      text: "Percentage of Time in Vehicle",
    },
    legend: {
      display: false,
      position: "right",
    },
  },
};
const dtdChartOptions = {
  scales: {
    x: {
      title: {
        display: true,
        text: "Number of Stations",
      },
    },
    y: {
      title: {
        display: true,
        text: "Time (s)",
      },
    },
  },
  plugins: {
    title: {
      display: true,
      text: "Journey Time Components",
    },
    legend: {
      display: true,
      position: "right",
    },
  },
};
