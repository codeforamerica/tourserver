class InterestPoint < ActiveRecord::Base
  attr_accessible :location, :name

   set_rgeo_factory_for_column(:location,
    RGeo::Geographic.spherical_factory(:srid => 3785))

end
