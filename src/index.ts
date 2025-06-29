import { Chart } from "chart.js";

type Distance = number; // (m)
type Time = number; // (s)
type Velocity = number; // (m/s)
type Acceleration = number; // (m/s/s)

interface SimulationResult {
  n_stn: number; // number of stations
  s_is: Distance; // interstation distance (m)
  t_vehicle: Time; // vehicle time (s)
  t_access: Time; // access time (s)
  t_wait: Time; // wait time (s)
  t_dtd: Time; // door-to-door journey time (s)
}

interface FormValues {
  s_j: number; // journey distance (km)
  tphpd: number; // trains per hour per direction.
  v_max: number; // maximum line speed (km/h)
  a_acc: number; // mean acceleration (m/s/s)
  a_dcc: number; // mean deceleration (m/s/s)
  t_dw: number; // dwell time (mins)
  v_walk: number; // average walking pace (km/h)
}

interface SimulationParameters {
  veh: Vehicle;
  ops: Operations;
  jny: Journey;
}

class Vehicle {
  public v_max: Velocity; // maximum line speed (m/s)
  public a_acc: Acceleration; // acceleration (m/s^2)
  public a_dcc: Acceleration; // deceleration (m/s^2)
  public s_acc: Distance; // distance to accelerate to v_max (m)
  public s_dcc: Distance; // distance to stop from v_max (m)
  public t_acc: Time; // time to accelerate to v_max (s)
  public t_dcc: Time; // time to stop from v_max (s)

  public constructor(
    v_max: Velocity,
    a_acc: Acceleration,
    a_dcc: Acceleration
  ) {
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
  public t_hw: Time; // headway (s)
  public t_dw: Time; // dwell time (s)

  public constructor(t_hw: Time, t_dw: Time) {
    this.t_hw = t_hw;
    this.t_dw = t_dw;
  }
}

class Journey {
  public s_j: Distance; // journey distance (m)
  public v_walk: Velocity; // walking speed (m/s)

  public constructor(s_j: Distance, v_walk: Velocity) {
    this.s_j = s_j;
    this.v_walk = v_walk;
  }
}

class Coverage_Paradox_Simulation {
  public jny: Journey;
  public veh: Vehicle;
  public ops: Operations;

  public sim_results: SimulationResult[];

  public constructor(params: SimulationParameters) {
    this.jny = params.jny;
    this.veh = params.veh;
    this.ops = params.ops;
    this.sim_results = [];
  }

  public runSimulation(): SimulationResult[] {
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

  public runIndSimulation(n_stn: number): SimulationResult {
    const s_is: Distance = this.jny.s_j / (n_stn - 0.5); // distance between stations
    const s_vmax: Distance = s_is - this.veh.s_acc - this.veh.s_dcc; // distance at v_max between stations
    const t_vmax: Time = s_vmax / this.veh.v_max; // time at v_max between stations
    const t_is: Time = t_vmax + this.veh.t_acc + this.veh.t_dcc; // time to travel between stations
    const t_vehicle: Time = t_is * (n_stn - 1) + this.ops.t_dw * (n_stn - 2); // vehicle time
    const t_access: Time = s_is / 4 / this.jny.v_walk; // access time
    const t_wait: Time = this.ops.t_hw / 2; // wait time
    const t_dtd: Time = t_vehicle + 2 * t_access + t_wait; // door to door journey time

    const simulationResult: SimulationResult = {
      n_stn: n_stn,
      s_is: s_is,
      t_vehicle: t_vehicle,
      t_access: t_access,
      t_wait: t_wait,
      t_dtd: t_dtd,
    };
    return simulationResult;
  }

  public getOptimumResult(): SimulationResult {
    let optimum_result = this.sim_results[0];
    for (var test_result of this.sim_results) {
      if (test_result.t_dtd <= optimum_result.t_dtd) {
        optimum_result = test_result;
      }
    }
    return optimum_result;
  }
}

function setFormValues(formVals: FormValues): void {
  for (const [key, value] of Object.entries(formVals)) {
    const selector = key + "-input";
    const inputElement = document.getElementById(selector) as HTMLInputElement;
    inputElement.value = value;
  }
}

function getFormValues(): FormValues {
  return {
    s_j: parseFloat(
      (document.getElementById("s_j-input") as HTMLInputElement).value
    ),
    tphpd: parseFloat(
      (document.getElementById("tphpd-input") as HTMLInputElement).value
    ),
    v_max: parseFloat(
      (document.getElementById("v_max-input") as HTMLInputElement).value
    ),
    a_acc: parseFloat(
      (document.getElementById("a_acc-input") as HTMLInputElement).value
    ),
    a_dcc: parseFloat(
      (document.getElementById("a_dcc-input") as HTMLInputElement).value
    ),
    t_dw: parseFloat(
      (document.getElementById("t_dw-input") as HTMLInputElement).value
    ),
    v_walk: parseFloat(
      (document.getElementById("v_walk-input") as HTMLInputElement).value
    ),
  };
}

type Unit = "m/s" | "km/h" | "m" | "km" | "tphpd" | "s" | "minute";

function convertUnit(baseValue: number, baseUnit: Unit, outUnit: Unit): number {
  let outValue: number = 0;
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

function buildSimulationParams(formValues: FormValues): SimulationParameters {
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

const DEFAULT_VALUES: FormValues = {
  s_j: 13.7, // journey distance (km)
  tphpd: 30, // trains per hour per direction.
  v_max: 90, // maximum line speed (km/h)
  a_acc: 1.3, // mean acceleration (m/s/s)
  a_dcc: 1.2, // mean deceleration (m/s/s)
  t_dw: 1.5, // dwell time (mins)
  v_walk: 4.7, // average walking pace (km/h)
};

const FORM_ID = "notebook-parameter-form";

function updateCharts(event: Event): void {
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
  const form = document.getElementById(FORM_ID) as HTMLFormElement;
  if (form) form.addEventListener("submit", updateCharts);
});

function buildPercVehChart(sim_result: SimulationResult[]): void {
  const percVehChartData: Chart.ChartData = {
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

function buildDTDChart(sim_result: SimulationResult[]): void {
  // if there is an existing chart then destroy it
  const dtdChartData: Chart.ChartData = {
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

let dtdChart: Chart;
let percVehChart: Chart;

const percVehChartOptions: Chart.ChartOptions = {
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
  } as Chart.LinearScale,
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

const dtdChartOptions: Chart.ChartOptions = {
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
  } as Chart.LinearScale,
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
