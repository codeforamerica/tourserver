class InterestPoint < ActiveRecord::Base
  attr_accessible :location, :name, :tours, :chapters, :tours_attributes

  set_rgeo_factory_for_column(:location, RGeo::Geographic.spherical_factory(:srid => 3785))

  has_many :chapters
  has_many :tours, :through => :chapters

  accepts_nested_attributes_for :tours

end
