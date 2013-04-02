class InterpItem < ActiveRecord::Base
  attr_accessible :name, :type

  has_many :interest_point_items
  has_many :interest_points, :through => :interest_point_items

  acts_as_list :scope => :interest_point_id
end
