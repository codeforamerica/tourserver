tour = Tour.new
tour.name = "Test 1"
tour.difficulty = "A"

parser = RGeo::WKRep::WKTParser.new(nil, :support_ewkt => true)
path = parser.parse('SRID=4326;LINESTRING (-122.4136788 37.7755665, -122.4136788 37.7755665, -122.4136547 37.7754748)')
tour.path = path

interest_point = InterestPoint.new
interest_point.location = parser.parse('SRID=4326;POINT(-122.4136547 37.7754748)')
interest_point.name = "PointOfInterest"

# make interp_item to add
interp_item = InterpItem.new
interp_item.name = "Test Interp Item"
puts interp_item.save

chapter = Chapter.new
chapter.interest_point = interest_point
tour.chapters << chapter

chapter = Chapter.new
chapter.interest_point = interest_point
tour.chapters << chapter


interest_point_item = InterestPointItem.new
interest_point_item.interp_item = interp_item
interest_point.interest_point_items << interest_point_item

media_item = MediaItem.new
media_item.name = "Test Media Item"
puts media_item.save

interp_item.media_items << media_item

#puts tour.interest_points

