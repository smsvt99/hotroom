document.addEventListener("DOMContentLoaded", async ()=>{
    try{
        let data = await fetch('/data');
        data = await data.json()
        drawChart(data);
    } catch (e) { 
        console.log(e);
    }
})

function drawChart(data){
  const allTemps = [
    ...data.map((obj) => obj.inC),
    ...data.map((obj) => obj.outC),
  ];

  // set the dimensions and margins of the graph
  var margin = { top: 100, right: 100, bottom: 100, left: 100 },
    width = window.innerWidth - margin.left - margin.right - 100,
    height = window.innerHeight - margin.top - margin.bottom - 100;

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

  const div = d3.select("body").append("div")	
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
    .domain(d3.extent(allTemps, (d) => d))
    .range([height, 0]);
    
  svg.append("g").call(d3.axisLeft(y).tickSize(-width))
  
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
    .style("stroke-width", 4)
    .style("fill", "none");


        //ideal temperature zone

        svg.append("rect")
        .attr("width", width)
        .attr("height", y(19) - y(23))
        .attr("y", y(23))    
        .attr("fill", "steelblue")
        .style("opacity", .3)
    
svg.append("text")
    .text("The \"Ideal Temperature\" Range")
    .attr("y", y(23) + 20) 
    .attr("x", 10)

//are-you-kidding zone

svg.append("rect")
    .attr("width", width)
    .attr("height", y(25))
    .attr("fill", "red")
    .style("opacity", .3)


svg.append("text")
    .text("The \"are-you-kidding-me\" Range")
    .attr("y", 20) 
    .attr("x", 10)



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
    // Second we need to enter in the 'values' part of this group
    .selectAll("myPoints")
    .data(function (d) {
      return d.values;
    })
    .enter()
    .append("circle")
    .attr("cx", function (d) {
        console.log(d)
      return x(d.time);
    })
    .attr("cy", function (d) {
      return y(d.value);
    })
    .attr("r", 4)
    .attr("stroke", "white")
    .on("mouseover", function(d,i) {
        div.transition()		
            .style("opacity", .9);		
        div.html(getTooltipText(i))	
            .style("left", (d.pageX - 100) + "px")		
            .style("top", (d.pageY - 50) + "px");	
        })					
    .on("mouseout", function(d) {		
        div.transition()			
            .style("opacity", 0);	
    });

    function getTooltipText(data){
        const date = new Date(data.time)
        const o = new Intl.DateTimeFormat("en",{
            timeZone: "America/New_York",
            timeStyle: "short",
            dateStyle: "medium"
        })
        const [dateStr, year, timeStr] = o.format(date).split(",")
        const C = data.value + "°C"
        const F = (data.value * 1.8 + 32).toFixed(2) + "°F"

        return `${dateStr}<br/>${timeStr}<br/>${C}<br/>(${F})`
    }

  // Add a legend at the end of each line
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
    .attr("x", 12) // shift the text a bit more right
    .text(function (d) {
      return d.name;
    })
    .style("fill", function (d) {
      return myColor(d.name);
    })
    .style("font-size", 15);

  svg
    .append("text")
    .text("Fig. 1, A live comparison of the temperature in my appartment and outside over time")
    .attr("y", "-40")
    .attr("text-anchor", "middle")
    .attr("x", width/2)

  svg
    .append("text")
    .text("Degrees Celsius")
    .attr("text-anchor", "middle")
    .attr("y", -40)
    .attr("x", -height/2)
    .attr("transform", "rotate(-90)")
    
  svg
  .append("text")
  .text("Timestamp")
  .attr("text-anchor", "middle")
  .attr("y", height + 40)
  .attr("x", width/2)  
}


