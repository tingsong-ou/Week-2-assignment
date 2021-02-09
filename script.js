const margin = {t: 50, r:50, b: 50, l: 50};
const size = {w: 1100, h: 700};
const svg = d3.select('svg');

// defining a container group
// which will contain everything within the SVG
// we can transform it to make things everything zoomable
const containerG = svg.append('g').classed('container', true);
let mapData, mapDataCounty, countyData, stateData;
let projection, range;
let mapG, bubblesG;

svg.attr('width', size.w)
    .attr('height', size.h);

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

    projection = d3.geoAlbersUsa()
        .fitSize([size.w, size.h], mapData);

    range = [10, 60];
    drawMap(mapData);
    drawBubbles(stateData,range);

    console.log(bubblesG.selectAll('circle'));



    //Updating Map When Changing Types & Data 
    d3.selectAll('.btn_map').on('click', function(e){
        let button = this.value;
        let mapMode;
        let dataMode;
        if(button == 'counties') {
            mapMode = mapDataCounty;
            dataMode = countyData;
            range = [3, 20];
        } else {
            mapMode = mapData;
            dataMode = stateData;
            range = [10, 60];
        }

        drawMap(mapMode);
        drawBubbles(dataMode, range);
    })
    
});


//Drawing and Updating Map
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

//Drawing And Updating Circles
function drawBubbles(data, range){

    let extent = d3.extent(data, d=> +d.cases);

    let radiusScale = d3.scaleSqrt()
        .domain(extent)
        .range(range);
    
    let colorScale = d3.scaleSequential()
        .domain([extent[1], extent[0]])
        .interpolator(d3.interpolateSpectral);
    
    let bubbleSelection = bubblesG.selectAll('circle')
        .data(data);

    
    bubbleSelection
        .join('circle')
        .attr('cx',0)
        .attr('cy', 0)
        .style('fill', d => colorScale(+d.cases))
        .style('opacity', 0.7)
        .attr('transform', d => 'translate('+projection([+d.long, +d.lat])+')')
        .attr('r', 0)
        .transition()
        .duration(1000)
        .attr('r', d => radiusScale(+d.cases));
    
}


