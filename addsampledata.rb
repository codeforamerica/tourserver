tour = Tour.new
tour.name = "Test 1"
tour.difficulty = "A"

parser = RGeo::WKRep::WKTParser.new(nil, :support_ewkt => true)
path = parser.parse('SRID=4326;LINESTRING (-122.4136788 37.7755665, -122.4136788 37.7755665, -122.4136547 37.7754748)')
tour.path = path

interest_point = InterestPoint.new
interest_point.location = parser.parse('SRID=4326;POINT(-122.4136547 37.7754748)')
interest_point.name = "PointOfInterest"
puts tour.save

chapter = Chapter.new
chapter.interest_point = interest_point

tour.chapters << chapter

chapter = Chapter.new
chapter.interest_point = interest_point

tour.chapters << chapter

puts tour.interest_points

