class Chapter < ActiveRecord::Base
  attr_accessible :interest_point_id, :tour_id, :position

  belongs_to :tour
  belongs_to :interest_point
  acts_as_list :scope => :tour_id
end
