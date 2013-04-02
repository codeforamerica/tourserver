class InterestPoint < ActiveRecord::Base
  attr_accessible :location, :name, :tours_attributes, :interep_items_attributes

  set_rgeo_factory_for_column(:location, RGeo::Geographic.spherical_factory(:srid => 3785))

  has_many :chapters
  has_many :tours, :through => :chapters

  accepts_nested_attributes_for :tours

  has_many :interest_point_items
  has_many :interep_items, :through => :interest_point_items

  accepts_nested_attributes_for :interep_items
end
