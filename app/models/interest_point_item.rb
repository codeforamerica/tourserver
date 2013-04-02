class InterestPointItem < ActiveRecord::Base
  attr_accessible :interest_point_id, :interp_item_id, :sequence

  belongs_to :interest_point
  belongs_to :interp_item
  acts_as_list :scope => :interest_point_id
end
