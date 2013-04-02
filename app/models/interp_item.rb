class InterpItem < ActiveRecord::Base
  attr_accessible :name, :itemtype

  has_many :interest_point_items
  has_many :interest_points, :through => :interest_point_items
end
