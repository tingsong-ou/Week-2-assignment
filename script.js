const margin = {t: 50, r:50, b: 50, l: 50};
const size = {w: 1100, h: 700};
const svg = d3.select('svg');

// DEFINING GROUP AND DECLARING GLOBAL VARIABLES
const containerG = svg.append('g').classed('container', true);
let mapData, mapDataCounty, countyData, stateData;
let projection, range, dataEntry, dataMode, mapMode, radiusScale;
let mapG, bubblesG, legendG, defs;

svg.attr('width', size.w)
    .attr('height', size.h);

let zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on('zoom', zoomed);

svg.call(zoom);
console.log(zoom);

//GENERATING VISUALIZATIONS
Promise.all([
    d3.json('data/maps/us-states.json'),
    d3.json('data/maps/us-counties.json'),
    d3.csv('data/countyData.csv'),
    d3.csv('data/stateData.csv')
]).then(function (datasets) {
    mapData = datasets[0];
    mapDataCounty = datasets[1];
    countyData = datasets[2];
    stateData = datasets[3];

    //DRAWING MAP
    mapG = containerG.append('g').classed('map', true);
    bubblesG = containerG.append('g').classed('bubbles', true);
    legendG = containerG.append('g').attr('transform','translate(800, 50)').classed('legend', true);

    projection = d3.geoAlbersUsa()
        .fitSize([size.w, size.h], mapData);
    range = [2, 30];
    dataEntry = 'cases';
    dataMode = countyData;
    mapMode = mapDataCounty;

    drawMap(mapMode);
    drawBubbles(dataMode,range,dataEntry);
    drawTooltip();

    //UPDATING THE MAP AND DATA

    d3.selectAll('button').on('click', function(e){

        let buttonMap = document.querySelector('.activeBlue').value;
        dataEntry = document.querySelector('.activeRed').value;

        if(buttonMap == 'counties') {
            mapMode = mapDataCounty;
            dataMode = countyData;
            range = [2, 30];
        } else {
            mapMode = mapData;
            dataMode = stateData;
            range = [10, 60];
        }

        drawMap(mapMode);
        drawBubbles(dataMode, range, dataEntry);
        drawTooltip();
    });
});


//------FUNCTIONS------

//Map Function
function drawMap(data){
    projection = d3.geoAlbersUsa()
        .fitSize([size.w, size.h], data);
    let path = d3.geoPath(projection);
    let map = mapG.selectAll('path')
        .data(data.features, d=>d.properties.GEO_ID);
    
    map.join('path')
        .attr('d', function(d){
            return path(d);
        });
}


//Circles Function
function drawBubbles(data, range, value, size = 1){

    let extent = d3.extent(data, d=> +d[value]);
    radiusScale = d3.scaleSqrt()
        .domain(extent)
        .range(range);
    
    let colorScale = d3.scaleSequential()
        .domain([extent[1],extent[0]])
        .interpolator(d3.interpolateSpectral);

    console.log(colorScale.range());

    let bubbleSelection = bubblesG.selectAll('circle')
        .data(data, d => d.county);

    bubbleSelection
        .join('circle')
        .attr('cx',0)
        .attr('cy', 0)
        .style('fill', d => colorScale(+d[value]))
        .style('opacity', 0)
        .attr('transform', d => 'translate('+projection([+d.long, +d.lat])+')')
        .attr('r', 0)
        .transition()
        .duration(900)
        .attr('r', d => radiusScale(+d[value])/size)
        .style('opacity', 0.7);

    drawLegend(value, colorScale, extent);
}


//Tooltip Function
function drawTooltip() {

    const tooltip = d3.select('.container')
        .append('div')
        .attr('class', 'tooltip');
    
    let tooltipText;

    let bubbles = bubblesG.selectAll('circle');
    bubbles.on('mouseover', function(e, d){

        let deathRate = Math.floor(d.deaths / d.cases * 1000)/10;
        if(d.county){
            tooltipText = `<b>COUNTY:</b> ${d.county}<br><b>STATE:</b> ${d.state}<br><b>CASES:</b> ${d.cases}<br><b>DEATHS:</b> ${d.deaths}<br><b>DEATH RATE</b> ${deathRate}%`;
        }else{
            tooltipText = `<b>STATE:</b> ${d.state}<br><b>CASES:</b> ${d.cases}<br><b>DEATHS:</b> ${d.deaths}<br><b>DEATH RATE</b> ${deathRate}%`;
        }

        tooltip.style('visibility', 'visible')
            .style('left', (e.pageX+20)+'px')
            .style('top', (e.pageY+10)+'px')
            .html(tooltipText);

        //Changing Opacity
        bubbles
        .transition()
        .duration(150)
        .style('opacity', 0.3);
        
        d3.select(this)
            .transition()
            .duration(150)
            .style('opacity', 1.0);

    }).on('mouseout', function(e, d){

        let r = +d3.select(this).attr('r');

        tooltip.style('visibility', 'hidden');
        //Restoring Opacity
        bubbles
        .transition()
        .duration(150)
        .style('opacity', 0.7);
    });
}


//Legend Function
function drawLegend(value, colorScale, extent){
    
    //Legend Size
    let legendWidth = 160;
    let legendHeight = 6;

    //Draw Rectangle
    colorScale.domain([legendWidth, 0]);

    let colorRange = d3.range(legendWidth);

    let legendGradient = legendG.selectAll('rect').data(colorRange, d => d);

    legendGradient
        .join('rect')
        .attr('x', (d, i) => i)
        .attr('y', 0)
        .attr('height', legendHeight)
        .attr('width', legendWidth/colorRange.length)
        .style('fill', (d, i) => colorScale(d))
        .style('opacity', 0.7);

    //Legent Texts

    let legendTitle = legendG.selectAll('.legend-title').data([value]);
    legendTitle
        .join('text')
        .attr('x', legendWidth/2)
        .attr('y', -5) 
        .attr('class', 'legend-title')
        .style('text-anchor', 'middle')
        .text(d => d[0].toUpperCase()+d.slice(1)+' Reported');
    
    let legendStart = legendG.selectAll('.start').data([extent[0]]);
    legendStart.join('text')
        .attr('x', 0)
        .attr('y', legendHeight+12)
        .attr('class', 'legend-value start')
        .style('text-anchor', 'middle')
        .text(d => d);

    let legendEnd = legendG.selectAll('.end').data([extent[1]]);
    legendEnd.join('text')
        .attr('x', legendWidth)
        .attr('y', legendHeight+12)
        .attr('class', 'legend-value end')
        .style('text-anchor', 'middle')
        .text(d => d);
}

//Zoom Function
function zoomed(e) {
    let transform = e.transform;
    containerG.attr("transform", transform);
    containerG.attr('stroke-width', 1 / transform.k);

    let bubbleSelection = bubblesG.selectAll('circle')
        .data(dataMode);
    
    bubbleSelection.attr('r', d => radiusScale(+d[dataEntry])/ Math.sqrt(transform.k));
}