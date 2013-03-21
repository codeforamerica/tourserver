class Tour < ActiveRecord::Base
  attr_accessible :difficulty, :name, :path, :tourtime

  set_rgeo_factory_for_column(:path,
    RGeo::Geographic.spherical_factory(:srid => 3785))

  has_many :chapters
  has_many :interest_points, :through => :chapters
end
