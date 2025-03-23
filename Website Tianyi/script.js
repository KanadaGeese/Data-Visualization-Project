// script.js

const TEAM_MAP = {
    "ATL": { city: "Atlanta", lat: 33.7573, lon: -84.3963 },
    "BOS": { city: "Boston", lat: 42.3663, lon: -71.0622 },
    "BRK": { city: "Brooklyn", lat: 40.6826, lon: -73.9754 },
    "CHA": { city: "Charlotte", lat: 35.2251, lon: -80.8392 },
    "CHI": { city: "Chicago", lat: 41.8807, lon: -87.6742 },
    "CLE": { city: "Cleveland", lat: 41.4965, lon: -81.6882 },
    "DAL": { city: "Dallas", lat: 32.7905, lon: -96.8104 },
    "DEN": { city: "Denver", lat: 39.7487, lon: -105.0077 },
    "DET": { city: "Detroit", lat: 42.3410, lon: -83.0551 },
    "GSW": { city: "San Francisco", lat: 37.7680, lon: -122.3877 },
    "HOU": { city: "Houston", lat: 29.7508, lon: -95.3621 },
    "IND": { city: "Indianapolis", lat: 39.7639, lon: -86.1555 },
    "LAC": { city: "Los Angeles", lat: 34.0430, lon: -118.2673 },
    "LAL": { city: "Los Angeles", lat: 34.0430, lon: -118.2673 },
    "MEM": { city: "Memphis", lat: 35.1382, lon: -90.0506 },
    "MIA": { city: "Miami", lat: 25.7814, lon: -80.1870 },
    "MIL": { city: "Milwaukee", lat: 43.0451, lon: -87.9172 },
    "MIN": { city: "Minneapolis", lat: 44.9795, lon: -93.2760 },
    "NOP": { city: "New Orleans", lat: 29.9490, lon: -90.0821 },
    "NYK": { city: "New York", lat: 40.7505, lon: -73.9934 },
    "OKC": { city: "Oklahoma City", lat: 35.4634, lon: -97.5151 },
    "ORL": { city: "Orlando", lat: 28.5392, lon: -81.3839 },
    "PHI": { city: "Philadelphia", lat: 39.9012, lon: -75.1720 },
    "PHO": { city: "Phoenix", lat: 33.4457, lon: -112.0712 },
    "POR": { city: "Portland", lat: 45.5316, lon: -122.6668 },
    "SAC": { city: "Sacramento", lat: 38.5802, lon: -121.4997 },
    "SAS": { city: "San Antonio", lat: 29.4269, lon: -98.4375 },
    "TOR": { city: "Toronto", lat: 43.6435, lon: -79.3791 },
    "UTA": { city: "Salt Lake City", lat: 40.7683, lon: -111.9011 },
    "WAS": { city: "Washington", lat: 38.8981, lon: -77.0209 }
  };
  
  // Load CSV data
  let data;
  d3.csv("../EDA NBA/nba_player_stats_C_Rami.csv", d3.autoType).then(dataset => {
    data = dataset;
  
    const players = Array.from(new Set(data.map(d => d.Player))).sort();
    const seasons = Array.from(new Set(data.map(d => d.Season))).sort((a, b) => a - b);
  
    const playerSelect = d3.select("#playerSelect");
    const seasonSelect = d3.select("#seasonSelect");
  
    playerSelect.selectAll("option")
      .data(players)
      .enter()
      .append("option")
      .text(d => d);
  
    seasonSelect.selectAll("option")
      .data(seasons)
      .enter()
      .append("option")
      .text(d => d);
  
    playerSelect.on("change", updateAll);
    seasonSelect.on("change", updateAll);
  
    updateAll();
  });
  
  function updateAll() {
    const player = d3.select("#playerSelect").property("value");
    const season = +d3.select("#seasonSelect").property("value");
  
    const filtered = data.filter(d => d.Player === player && d.Season === season);
    if (filtered.length === 0) return;
    const playerRow = filtered[0];
  
    drawMap(player);
    drawComparison(playerRow);
    drawPie(playerRow);
  }
  
  function drawMap(player) {
    const svg = d3.select("#map");
    svg.selectAll("*").remove();
  
    const playerTeams = data.filter(d => d.Player === player).map(d => d.Team);
    const cities = Array.from(new Set(playerTeams)).map(code => TEAM_MAP[code]).filter(Boolean);
  
    const projection = d3.geoAlbersUsa().translate([400, 200]).scale(1000);
  
    svg.selectAll("circle")
      .data(cities)
      .enter()
      .append("circle")
      .attr("cx", d => projection([d.lon, d.lat])[0])
      .attr("cy", d => projection([d.lon, d.lat])[1])
      .attr("r", 6)
      .attr("fill", "#4e79a7")
      .append("title")
      .text(d => d.city);
  }
  
  function drawComparison(playerRow) {
    const svg1 = d3.select("#pointsMinutes").selectAll("*").remove();
    const svg2 = d3.select("#rebounds").selectAll("*").remove();
  
    const sameSeason = data.filter(d => d.Season === playerRow.Season);
  
    // Find most similar player (closest Points)
    const similar = sameSeason.reduce((acc, cur) => {
      if (cur.Player !== playerRow.Player) {
        const diff = Math.abs(cur.Points - playerRow.Points);
        if (!acc || diff < Math.abs(acc.Points - playerRow.Points)) acc = cur;
      }
      return acc;
    }, null);
  
    // Find teammate with same position
    const teammate = sameSeason.find(d => d.Team === playerRow.Team && d.Pos === playerRow.Pos && d.Player !== playerRow.Player);
  
    const compareData = [playerRow, similar, teammate].filter(Boolean);
    const labels = ["Selected", "Similar", "Teammate"];
  
    // Bar chart for Points and MP
    const svgPM = d3.select("#pointsMinutes");
    const w = +svgPM.attr("width"), h = +svgPM.attr("height"), m = 40;
    const x = d3.scaleBand().domain(labels).range([m, w - m]).padding(0.3);
    const y = d3.scaleLinear().domain([0, d3.max(compareData, d => Math.max(d.Points, d.MP))]).range([h - m, m]);
  
    svgPM.append("g").attr("transform", `translate(0,${h - m})`).call(d3.axisBottom(x));
    svgPM.append("g").attr("transform", `translate(${m},0)`).call(d3.axisLeft(y));
  
    svgPM.selectAll(".bar")
      .data(compareData)
      .enter()
      .append("rect")
      .attr("x", (d, i) => x(labels[i]))
      .attr("y", d => y(d.Points))
      .attr("width", x.bandwidth() / 2)
      .attr("height", d => y(0) - y(d.Points))
      .attr("fill", "#59a14f");
  
    svgPM.selectAll(".line")
      .data(compareData)
      .enter()
      .append("rect")
      .attr("x", (d, i) => x(labels[i]) + x.bandwidth() / 2)
      .attr("y", d => y(d.MP))
      .attr("width", x.bandwidth() / 2)
      .attr("height", d => y(0) - y(d.MP))
      .attr("fill", "#edc949");
  
    // Bar chart for TRB
    const svgTRB = d3.select("#rebounds");
    const y2 = d3.scaleLinear().domain([0, d3.max(compareData, d => d.TRB)]).range([h - m, m]);
    svgTRB.append("g").attr("transform", `translate(0,${h - m})`).call(d3.axisBottom(x));
    svgTRB.append("g").attr("transform", `translate(${m},0)`).call(d3.axisLeft(y2));
  
    svgTRB.selectAll(".bar")
      .data(compareData)
      .enter()
      .append("rect")
      .attr("x", (d, i) => x(labels[i]))
      .attr("y", d => y2(d.TRB))
      .attr("width", x.bandwidth())
      .attr("height", d => y2(0) - y2(d.TRB))
      .attr("fill", "#4e79a7");
  }
  
  function drawPie(playerRow) {
    const svg = d3.select("#pieChart");
    svg.selectAll("*").remove();
  
    const totalPoints = playerRow.Points;
    const p2 = playerRow["2P"] * 2;
    const p3 = playerRow["3P"] * 3;
    const pieData = [
      { label: "2P Points", value: p2 },
      { label: "3P Points", value: p3 }
    ];
  
    const w = +svg.attr("width"), h = +svg.attr("height");
    const radius = Math.min(w, h) / 2 - 10;
  
    const pie = d3.pie().value(d => d.value);
    const arc = d3.arc().innerRadius(0).outerRadius(radius);
    const color = d3.scaleOrdinal(["#59a14f", "#edc949"]);
  
    const g = svg.append("g").attr("transform", `translate(${w / 2},${h / 2})`);
  
    g.selectAll("path")
      .data(pie(pieData))
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", d => color(d.data.label))
      .append("title")
      .text(d => `${d.data.label}: ${((d.data.value / totalPoints) * 100).toFixed(1)}%`);
  }