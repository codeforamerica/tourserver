class InterpItem < ActiveRecord::Base
  attr_accessible :name, :media_items_attributes

  has_many :interest_point_items
  has_many :interest_points, :through => :interest_point_items
  
  has_many :media_items, order: :position
  accepts_nested_attributes_for :media_items, :update_only => true
end
