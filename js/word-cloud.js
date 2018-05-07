//import data and convert to usable form (route object {start, end})
function getData() {
    var defer = $.Deferred();   //using jQuery for asynchronous loading
    var streetWordCount = {};
    var streetNames = [];        //all routes
    d3.csv("../trips.csv", function (error, data) {
      if(error){
        defer.reject(error);    //catch error in d3 parsing
      }
      data.forEach(function (d) {
        var streets = [];
        streets = d.streetnames.split(',');   //split array of streetnames
        if(streets.length > 1){
          streets.forEach(name => {
              streetNames.push(name);
          });
        }
      });
      streetNames.forEach(name => {
        if (streetWordCount[name]){
            streetWordCount[name]++;
          } else {
            streetWordCount[name] = 1;
          }
      });
      defer.resolve(streetWordCount);    //once d3 is finished, resolve the promise
    });
    return defer.promise();
}

  //using jQuery again to retrieve the data when it is finished loading, then perform other functions
  $.when(
    getData()
  ).done(
    (data) => {
        //form cloud
        var svg_location = "#chart";
        var width = 860;
        var height = 660;

        var fill = d3.scale.category20();

        var word_entries = d3.entries(data);

        var xScale = d3.scale.linear()
           .domain([0, d3.max(word_entries, function(d) {
              return d.value;
            })
           ])
           .range([10,100]);

        d3.layout.cloud().size([width, height])
          .timeInterval(20)
          .words(word_entries)
          .fontSize(function(d) { return xScale(+d.value); })
          .text(function(d) { return d.key; })
          .rotate(function() { return ~~(Math.random() * 2) * 90; })
          .font("Impact")
          .on("end", draw)
          .start();

        function draw(words) {
          var div = d3.select("body").append("div")   
            .attr("class", "tooltip")               
            .style("opacity", 0);
          d3.select(svg_location).append("svg")
              .attr("width", width)
              .attr("height", height)
            .append("g")
              .attr("transform", "translate(" + [width >> 1, height >> 1] + ")")
            .selectAll("text")
              .data(words)
            .enter().append("text")
              .style("font-size", function(d) { return xScale(d.value) + "px"; })
              .style("font-family", "Impact")
              .style("fill", function(d, i) { return fill(i); })
              .attr("text-anchor", "middle")
              .attr("transform", function(d) {
                return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
              })
              .text(function(d) { return d.key; })
              .on("mouseover", function(d) {      
                div.transition()        
                    .duration(200)      
                    .style("opacity", 1.0);      
                div .html("Occurances: " + d.value + "<br/>")  
                    .style("left", (d3.event.pageX) + "px")     
                    .style("top", (d3.event.pageY - 28) + "px");
                console.log(d.key)    
                })                  
            .on("mouseout", function(d) {       
                div.transition()        
                    .duration(500)      
                    .style("opacity", 0);   
            });
        }


        d3.layout.cloud().stop();
      }
  
  ).fail(function (err) {
    console.log(err);
  });