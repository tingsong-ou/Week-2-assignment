const margin = {t: 50, r:50, b: 50, l: 50};
const size = {w: 1200, h: 900};
const svg = d3.select('svg');

// defining a container group
// which will contain everything within the SVG
// we can transform it to make things everything zoomable
const containerG = svg.append('g').classed('container', true);
let mapData, mapDataCounty, popData, hexbinPopData;
let radiusScale, projection, hexbin;
let mapG;

svg.attr('width', size.w)
    .attr('height', size.h);

Promise.all([
    d3.json('data/maps/us-states.json'),
    d3.json('data/maps/us-counties.json')
]).then(function (datasets) {
    mapData = datasets[0];
    mapDataCounty = datasets[1];
    //popData = datasets[1];

    // --------- DRAW MAP ----------
    // creating a group for map paths
    mapG = containerG.append('g').classed('map', true);

    // defining a projection that we will use
    projection = d3.geoAlbersUsa()
        .fitSize([size.w, size.h], mapData);

    // draw map
    drawMap(mapData);

    //Update Map When Switching Map Types & Data Types 
    d3.selectAll('.btn_map').on('click', function(e){
        let button = this.value;
        let mapMode;
        if(button == 'counties') mapMode = mapDataCounty;
        else mapMode = mapData;

        drawMap(mapMode);
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
        .transition()
        .duration(1000)
        .attr('d', function(d){
            return path(d);
        });
}


