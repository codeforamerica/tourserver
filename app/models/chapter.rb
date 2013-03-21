class Chapter < ActiveRecord::Base
  attr_accessible :interest_point_id, :sequence, :tour_id

  belongs_to :tour
  belongs_to :interest_point
  
end
