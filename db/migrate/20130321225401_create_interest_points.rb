class CreateInterestPoints < ActiveRecord::Migration
  def change
    create_table :interest_points do |t|
      t.string :name
      t.point :location, :srid => 3785

      t.timestamps
    end
  end
end
