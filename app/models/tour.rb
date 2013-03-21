class Tour < ActiveRecord::Base
  attr_accessible :difficulty, :name, :path, :tourtime

  set_rgeo_factory_for_column(:path,
    RGeo::Geographic.spherical_factory(:srid => 3785))


end
