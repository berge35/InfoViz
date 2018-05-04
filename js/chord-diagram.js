
//import data and convert to usable form (route object {start, end})
function getData() {
  var defer = $.Deferred();   //using jQuery for asynchronous loading
  var validRoutes = [];    //all trps with more than one streetname
  d3.csv("../trips.csv", function (error, data) {
    if(error){
      defer.reject(error);    //catch error in d3 parsing
    }
    data.forEach(function (d) {
      var streets = [];
      streets = d.streetnames.split(',');   //split array of streetnames
      if(streets.length > 1){
        validRoutes.push({start: streets[0], end: streets[streets.length - 1]});
      }
    });
    defer.resolve(validRoutes)    //once d3 is finished, resolve the promise
  });
  return defer.promise();
}

//function that return a list of unique road names
function getUniqueRoads(routes){
  var roads = [];
  routes.forEach(route => {
    if (!roads.includes(route.start)){
      roads.push(route.start);
    }
    if (!roads.includes(route.end)){
      roads.push(route.end);
    }
  });
  return roads;
}


//convert array of route objects into a matrix to be used by d3
function convertToMatrix(routes){
  var matrix =[];
  var uniqueStreets = getUniqueRoads(routes);
  //init matrix
  for (let i = 0; i < uniqueStreets.length; i++) {
    matrix[i] = new Array(uniqueStreets.length);
    matrix[i].fill(0);
  }
  //forming the matrix
  for (let i = 0; i < routes.length; i++) {
    var si = uniqueStreets.findIndex(
      (street) => { return routes[i].start == street}
    );
    var ei = uniqueStreets.findIndex(
      (street) => { return routes[i].end == street}
    )
    matrix[si][ei] += 1;
  }
  //filter data to include routes with 5 or more entries
  for (let i = 0; i < uniqueStreets.length; i++) {
    for (let j = 0; j < uniqueStreets.length; j++) {
      if(matrix[i][j] < 0){
        matrix[i][j] = 0;
      }
    }
  }
  return matrix;

}

//using jQuery again to retrieve the data when it is finished loading, then perform other functions
$.when(
  getData()
).done(
  (data) => {
    //construct chord diagram
    var matrix = convertToMatrix(data)
    var visual = document.getElementById("visual");

    var rotation = .99;
    var uniqueStreets = getUniqueRoads(data);
    var chord_options = {
        "gnames": uniqueStreets,
        "rotation": rotation,
        "colors": ["#031d44", "#03357f", "#7084a3", "#8abee2", "#81d7f9", "#02238e", "#4da1ea", "#58c143", "#93bded", "#c2dd6e", "#fffddd", "#9fa9f4", "#3e3e87"]
    };

      Chord(visual, chord_options, matrix);
  
    d3.select(self.frameElement).style("height", "600px");
  }
).fail(function (err) {
  console.log(err);
});



    function Chord(container, options, matrix) {

        // initialize the chord configuration variables
        var config = {
            width: 640,
            height: 560,
            rotation: 0,
            textgap: 10,
            colors: ["#031d44", "#03357f", "#7084a3", "#8abee2", "#81d7f9", "#02238e", "#4da1ea", "#58c143", "#93bded", "#c2dd6e", "#fffddd", "#9fa9f4", "#3e3e87"]
        };
        
        // add options to the chord configuration object
        if (options) {
            extend(config, options);
        }
        
        // set chord visualization variables from the configuration object
        var offset = Math.PI * config.rotation,
            width = config.width,
            height = config.height,
            textgap = config.textgap,
            colors = config.colors;
        
        // set viewBox and aspect ratio to enable a resize of the visual dimensions 
        var viewBoxDimensions = "0 0 " + width + " " + height,
            aspect = width / height;
        
        if (config.gnames) {
            gnames = config.gnames;
        } else {
            // make a list of names
            gnames = [];
            for (var i=97; i<matrix.length; i++) {
                gnames.push(String.fromCharCode(i));
            }
        }

        // start the d3 magic
        var chord = d3.layout.chord()
            .padding(.05)
            .sortSubgroups(d3.descending)
            .matrix(matrix);

        var innerRadius = Math.min(width, height) * .46,
            outerRadius = innerRadius * 1.1;

        var fill = d3.scale.ordinal()
            .domain(d3.range(matrix.length-1))
            .range(colors);
    
        var svg = d3.select("body").append("svg")
            .attr("id", "visual")
            .attr("viewBox", viewBoxDimensions)
            .attr("preserveAspectRatio", "xMinYMid")    // add viewBox and preserveAspectRatio
            .attr("width", width)
            .attr("height", height)
          .append("g")
            .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

        var g = svg.selectAll("g.group")
            .data(chord.groups)
          .enter().append("svg:g")
            .attr("class", "group");

        g.append("svg:path")
            .style("fill", function(d) { return fill(d.index); })
            .style("stroke", function(d) { return fill(d.index); })
            .attr("id", function(d, i) { return "group" + d.index; })
            .attr("d", d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius).startAngle(startAngle).endAngle(endAngle))
            .on("mouseover", fade(.1))
            .on("mouseout", fade(1));

        g.append("svg:text")
            .each(function(d) {d.angle = ((d.startAngle + d.endAngle) / 2) + offset; })
            .attr("dy", ".35em")
            .attr("text-anchor", function(d) { return d.angle > Math.PI ? "end" : null; })
            .attr("transform", function(d) {
                return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
                    + "translate(" + (outerRadius + textgap) + ")"
                    + (d.angle > Math.PI ? "rotate(180)" : "");
              })
            //.text(function(d) { return gnames[d.index]; });

        svg.append("g")
            .attr("class", "chord")
          .selectAll("path")
            .data(chord.chords)
          .enter().append("path")
            .attr("d", d3.svg.chord().radius(innerRadius).startAngle(startAngle).endAngle(endAngle))
            .style("fill", function(d) { return fill(d.source.index); })
            .style("opacity", 1)
          .append("svg:title")
            .text(function(d) { 
                return  d.source.value + "  " + gnames[d.source.index] + " shared with " + gnames[d.target.index]; 
            });
    
        // helper functions start here
        
        function startAngle(d) {
            return d.startAngle + offset;
        }

        function endAngle(d) {
            return d.endAngle + offset;
        }
        
        function extend(a, b) {
            for( var i in b ) {
                a[ i ] = b[ i ];
            }
        }

        // Returns an event handler for fading a given chord group.
        function fade(opacity) {
            return function(g, i) {
                svg.selectAll(".chord path")
                    .filter(function(d) { return d.source.index != i && d.target.index != i; })
                    .transition()
                    .style("opacity", opacity);
            };
        }
        
        
        window.onresize = function() {
            var targetWidth = (window.innerWidth < width)? window.innerWidth : width;
            
            var svg = d3.select("#visual")
                .attr("width", targetWidth)
                .attr("height", targetWidth / aspect);
        }

        
    }

