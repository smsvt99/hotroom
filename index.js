let data;

function getEndpoint() {
  const browserUrl = window.location.href;
  if (!browserUrl.includes("?")) {
    const oneDay = 1000 * 60 * 60 * 24;
    const oneDayAgo = Date.now() - oneDay;
    window.location.href = `?start=${oneDayAgo}`;
  } else {
    const params = `?${window.location.href.split("?")[1]}`;
    return `/data${params}`;
  }
}

async function getData(endpoint) {
  try {
    let data = await fetch(endpoint);
    data = await data.json();
    return data;
  } catch (e) {
    console.log(e);
  }
}

function drawChart(data) {
  const allTemps = [
    ...data.map((obj) => obj.inC),
    ...data.map((obj) => obj.outC),
  ];

  // set the dimensions and margins of the graph
  var margin = { top: 100, right: 100, bottom: 100, left: 100 },
    width = window.innerWidth - margin.left - margin.right - 50,
    height = window.innerHeight - margin.top - margin.bottom;

  // append the svg object to the body of the page
  var svg = d3
    .select("#svgRoot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // List of groups (here I have one group per column)
  var allGroup = ["inC", "outC"];

  const div = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  // Reformat the data: we need an array of arrays of {x, y} tuples
  var dataReady = allGroup.map(function (grpName) {
    // .map allows to do something for each element of the list
    return {
      name: grpName,
      values: data.map(function (d) {
        return { time: d.time, value: +d[grpName] };
      }),
    };
  });
  // I strongly advise to have a look to dataReady with
  // console.log(dataReady)

  // A color scale: one color for each group
  var myColor = d3.scaleOrdinal().domain(allGroup).range(d3.schemeSet1);

  // Add X axis --> it is a date format
  var x = d3
    .scaleTime()
    .domain(
      d3.extent(data, function (d) {
        return d.time;
      })
    )
    .range([0, width]);
  svg
    .append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).tickSize(-height));

  // Add Y axis
  var y = d3
    .scaleLinear()
    // .domain(d3.extent(allTemps, (d) => d))
    .domain([d3.min(allTemps) - 1, d3.max(allTemps) + 1])
    .range([height, 0]);

  svg.append("g").call(d3.axisLeft(y).tickSize(-width));

  // Add the lines
  var line = d3
    .line()
    .x(function (d) {
      return x(+d.time);
    })
    .y(function (d) {
      return y(+d.value);
    });
  svg
    .selectAll("myLines")
    .data(dataReady)
    .enter()
    .append("path")
    .attr("d", function (d) {
      return line(d.values);
    })
    .attr("stroke", function (d) {
      return myColor(d.name);
    })
    .style("stroke-width", 3)
    .style("fill", "none");

  //ideal temperature zone

  const idealGroup = svg
    .append("g")
    .attr("transform", `translate(0, ${y(23)})`)
    .attr("fill", "none")
    .attr("stroke-width", 2);

  const idealRect = idealGroup
    .append("rect")
    .attr("width", width)
    .attr("height", y(19) - y(23))
    .attr("fill", "grey")
    .style("opacity", 0.2);

  idealGroup
    .append("text")
    .text("i")
    .attr("stroke", "grey")
    .attr("stroke-width", 1)
    .style("font-size", 10)
    .attr("y", 13)
    .attr("x", 9);

  idealGroup
    .append("circle")
    .attr("stroke", "grey")
    .attr("r", 8)
    .attr("cx", 10)
    .attr("cy", 10)
    .on("mouseover", function (d, i) {
      div.transition().style("opacity", 0.9);
      div
        .html("Ideal Indoor Temperature Range")
        .style("left", d.pageX - 25 + "px")
        .style("top", d.pageY - 25 + "px");
      idealRect.transition().style("opacity", 0.4);
    })
    .on("mouseout", function (d) {
      div.transition().style("opacity", 0);
      idealRect.transition().style("opacity", 0.2);
    });

  //too hot range

  if (d3.max(allTemps) > 25) {
    const tooHotGroup = svg.append("g").attr("y", y(25));

    tooHotGroup
      .append("text")
      .text("i")
      .attr("stroke", "grey")
      .attr("stroke-width", 1)
      .style("font-size", 10)
      .attr("y", 13)
      .attr("x", 9);

    const tooHotRect = tooHotGroup
      .append("rect")
      .attr("width", width)
      .attr("height", y(25))
      .attr("fill", "red")
      .style("opacity", 0.1);

    tooHotGroup
      .append("circle")
      .attr("stroke", "grey")
      .attr("fill", "none")
      .attr("r", 8)
      .attr("cx", 10)
      .attr("cy", 10)
      .on("mouseover", function (d, i) {
        div.transition().style("opacity", 0.9);
        div
          .html("Unexceptably Hot Range")
          .style("left", d.pageX - 25 + "px")
          .style("top", d.pageY - 25 + "px");
        tooHotRect.transition().style("opacity", 0.4);
      })
      .on("mouseout", function (d) {
        div.transition().style("opacity", 0);
        tooHotRect.transition().style("opacity", 0.1);
      });
  }

  //freezing range

  if (d3.min(allTemps) < 0) {
    const freezingGroup = svg
      .append("g")
      .attr("transform", `translate(0, ${y(0)})`);

    const freezingRect = freezingGroup
      .append("rect")
      .attr("width", width)
      .attr("height", height - y(0))
      .attr("fill", "skyblue")
      .style("opacity", 0.3);

    freezingGroup
      .append("text")
      .text("i")
      .attr("stroke", "grey")
      .attr("stroke-width", 1)
      .style("font-size", 10)
      .attr("y", 13)
      .attr("x", 9);

    freezingGroup
      .append("circle")
      .attr("stroke", "grey")
      .attr("fill", "none")
      .attr("r", 8)
      .attr("cx", 10)
      .attr("cy", 10)
      .on("mouseover", function (d, i) {
        div.transition().style("opacity", 0.9);
        div
          .html("Freezing")
          .style("left", d.pageX - 25 + "px")
          .style("top", d.pageY - 25 + "px");
        freezingRect.transition().style("opacity", 0.4);
      })
      .on("mouseout", function (d) {
        div.transition().style("opacity", 0);
        freezingRect.transition().style("opacity", 0.3);
      });
  }

  // Add the points
  svg
    // First we need to enter in a group
    .selectAll("myDots")
    .data(dataReady)
    .enter()
    .append("g")
    .style("fill", function (d) {
      return myColor(d.name);
    })

    .selectAll("myPoints")
    .data(function (d) {
      return d.values;
    })
    .enter()
    .append("circle")
    .attr("cx", function (d) {
      return x(d.time);
    })
    .attr("cy", function (d) {
      return y(d.value);
    })
    .attr("r", 5)
    .attr("stroke", "white")
    .on("mouseover", function (d, i) {
      div.transition().style("opacity", 0.9);
      div
        .html(getTooltipText(i))
        .style("left", d.pageX - 75 + "px")
        .style("top", d.pageY - 75 + "px");
    })
    .on("mouseout", function (d) {
      div.transition().style("opacity", 0);
    });

  function getTooltipText(data) {
    const date = new Date(data.time);
    const o = new Intl.DateTimeFormat("en", {
      timeZone: "America/New_York",
      timeStyle: "short",
      dateStyle: "medium",
    });
    const [dateStr, year, timeStr] = o.format(date).split(",");
    const C = data.value + "°C";
    const F = (data.value * 1.8 + 32).toFixed(2) + "°F";

    return `${dateStr}, ${timeStr}<hr/>${C} (${F})`;
  }

  // legends
  svg
    .selectAll("myLabels")
    .data(dataReady)
    .enter()
    .append("g")
    .append("text")
    .datum(function (d) {
      return { name: d.name, value: d.values[d.values.length - 1] };
    }) // keep only the last value of each time series
    .attr("transform", function (d) {
      return "translate(" + x(d.value.time) + "," + y(d.value.value) + ")";
    }) // Put the text at the position of the last point
    .attr("x", 12)
    .text(function (d) {
      return d.name;
    })
    .style("fill", function (d) {
      return myColor(d.name);
    })
    .style("font-size", 15);

  //labels
  svg
    .append("text")
    .text(
      "Fig. 1, A live comparison of the temperature in my appartment and outside over time"
    )
    .attr("y", "-40")
    .attr("text-anchor", "middle")
    .attr("x", width / 2);

  svg
    .append("text")
    .text("Degrees Celsius")
    .attr("text-anchor", "middle")
    .attr("y", -40)
    .attr("x", -height / 2)
    .attr("transform", "rotate(-90)");

  svg
    .append("text")
    .text("Timestamp")
    .attr("text-anchor", "middle")
    .attr("y", height + 40)
    .attr("x", width / 2);
}

const start = document.getElementById("start");
const clearStart = document.getElementById("clearStart");
const end = document.getElementById("end");
const clearEnd = document.getElementById("clearEnd");
const grade = document.getElementById("grade");
const submit = document.getElementById("submit");

submit.addEventListener("click", () => {
  function hasValue(element) {
    return element.value !== "";
  }

  let nextUrl = "?";

  if (hasValue(start)) {
    nextUrl += `start=${new Date(start.value).valueOf()}&`;
  }
  if (hasValue(end)) {
    nextUrl += `end=${new Date(end.value).valueOf()}&`;
  }
  if (hasValue(grade)) {
    nextUrl += `grade=${grade.value}&`;
  }

  window.location.href = nextUrl;
});

clearStart.addEventListener("click", () => clear(start));
clearEnd.addEventListener("click", () => clear(end));

function clear(element) {
  element.value = "";
}

function syncInputs() {
  const url = new URL(window.location.href);
  const params = new URLSearchParams(url.search);

  let paramsStart = params.get("start");
  if (paramsStart !== null) {
    paramsStart = parseInt(paramsStart) - 1000 * 60 * 60 * 5;
    paramsStart = new Date(paramsStart).toISOString().replace("Z", "");
    start.value = paramsStart;
  }

  let paramsEnd = params.get("end");
  if (paramsEnd !== null) {
    paramsEnd = parseInt(paramsEnd) - 1000 * 60 * 60 * 5;
    paramsEnd = new Date(paramsEnd).toISOString().replace("Z", "");
    end.value = paramsEnd;
  }

  let paramsGrade = params.get("grade");
  paramsGrade = paramsGrade === null ? 1 : parseInt(paramsGrade);
  grade.value = paramsGrade;
}

(async function init() {
  syncInputs();
  const endPoint = getEndpoint();
  data = await getData(endPoint);
  drawChart(data);
  d3.select("body").style("opacity", 1);
})();

window.addEventListener("resize", () => {
  document.getElementById("svgRoot").innerHTML = "";
  drawChart(data);
});
